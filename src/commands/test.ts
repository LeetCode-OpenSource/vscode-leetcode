// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as fse from "fs-extra";
import * as vscode from "vscode";
import { debugExecutor } from "../debug/debugExecutor";
import problemTypes from "../debug/problemTypes";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx, UserStatus } from "../shared";
import { fileMeta, parseTestString } from "../utils/problemUtils";
import { DialogType, promptForOpenOutputChannel, showFileSelectDialog } from "../utils/uiUtils";
import { getActiveFilePath } from "../utils/workspaceUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";

const supportDebugLanguages: string[] = ["javascript", "python3"];

export async function testSolution(uri?: vscode.Uri): Promise<void> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return;
        }

        const filePath: string | undefined = await getActiveFilePath(uri);
        if (!filePath) {
            return;
        }
        const picks: Array<IQuickItemEx<string>> = [];
        picks.push(
            {
                label: "$(three-bars) Default test cases",
                description: "",
                detail: "Test with the default cases",
                value: ":default",
            },
            {
                label: "$(pencil) Write directly...",
                description: "",
                detail: "Write test cases in input box",
                value: ":direct",
            },
            {
                label: "$(file-text) Browse...",
                description: "",
                detail: "Test with the written cases in file",
                value: ":file",
            },
        );

        const fileContent: Buffer = fs.readFileSync(filePath);
        const meta: { id: string, lang: string } | null = fileMeta(fileContent.toString());

        if (meta != null && supportDebugLanguages.indexOf(meta.lang) !== -1 && problemTypes[meta.id] != null) {
            picks.push({
                label: "$(three-bars) Debug by default test cases",
                description: "",
                detail: "Debug by default test cases",
                value: ":debug-default",
            });
            picks.push({
                label: "$(pencil) Debug by writing directly...",
                description: "",
                detail: "Debug by writing test cases in input box",
                value: ":debug-direct",
            });
        }

        const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
        if (!choice) {
            return;
        }

        let result: string | undefined;
        switch (choice.value) {
            case ":default":
                result = await leetCodeExecutor.testSolution(filePath);
                break;
            case ":direct":
                const testString: string | undefined = await vscode.window.showInputBox({
                    prompt: "Enter the test cases.",
                    validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "Test case must not be empty.",
                    placeHolder: "Example: [1,2,3]\\n4",
                    ignoreFocusOut: true,
                });
                if (testString) {
                    result = await leetCodeExecutor.testSolution(filePath, parseTestString(testString));
                }
                break;
            case ":file":
                const testFile: vscode.Uri[] | undefined = await showFileSelectDialog(filePath);
                if (testFile && testFile.length) {
                    const input: string = (await fse.readFile(testFile[0].fsPath, "utf-8")).trim();
                    if (input) {
                        result = await leetCodeExecutor.testSolution(filePath, parseTestString(input.replace(/\r?\n/g, "\\n")));
                    } else {
                        vscode.window.showErrorMessage("The selected test file must not be empty.");
                    }
                }
                break;
            case ":debug-default":
                result = await debugExecutor.execute(filePath, problemTypes[meta!.id]!.testCase.replace(/"/g, '\\"'), meta!.lang);
                break;
            case ":debug-direct":
                const ts: string | undefined = await vscode.window.showInputBox({
                    prompt: "Enter the test cases.",
                    validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "Test case must not be empty.",
                    placeHolder: "Example: [1,2,3]\\n4",
                    ignoreFocusOut: true,
                });
                if (ts) {
                    result = await debugExecutor.execute(filePath, ts.replace(/"/g, '\\"'), meta!.lang);
                }
                break;
            default:
                break;
        }
        if (!result) {
            return;
        }
        leetCodeSubmissionProvider.show(result);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);
    }
}
