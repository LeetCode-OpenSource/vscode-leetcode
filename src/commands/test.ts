// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx, UserStatus } from "../shared";
import { isWindows, usingCmd } from "../utils/osUtils";
import { getTestFile, getWorkspaceFolder } from "../utils/settingUtils";
import { DialogType, promptForOpenOutputChannel, showFileSelectDialog } from "../utils/uiUtils";
import { getActiveFilePath } from "../utils/workspaceUtils";
import * as wsl from "../utils/wslUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";

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
            {
                label: "$(file-text) Test file...",
                description: "",
                detail: "Test with the written cases in file specified in settings",
                value: ":settings-file",
            },
        );
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
                    result = await testSelectedFile(input, filePath);
                }
                break;
            case ":settings-file":
                result = await testSelectedFile((await fse.readFile(path.join(getWorkspaceFolder(), getTestFile()), "utf-8")).trim(), filePath);
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

export async function testSolutionQuickFile(uri?: vscode.Uri): Promise<void> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return;
        }

        const filePath: string | undefined = await getActiveFilePath(uri);
        if (!filePath) {
            return;
        }

        const result: string | undefined = await testSelectedFile((await fse.readFile(path.join(getWorkspaceFolder(), getTestFile()), "utf-8")).trim(), filePath);

        if (!result) {
            return;
        }
        leetCodeSubmissionProvider.show(result);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);
    }
}

async function testSelectedFile(input: string, filePath: string): Promise<string | undefined> {
    if (input) {
        return await leetCodeExecutor.testSolution(filePath, parseTestString(input.replace(/\r?\n/g, "\\n")));
    } else {
        vscode.window.showErrorMessage("The selected test file must not be empty.");
    }

    return undefined;
}

function parseTestString(test: string): string {
    if (wsl.useWsl() || !isWindows()) {
        return `'${test}'`;
    }

    // In windows and not using WSL
    if (usingCmd()) {
        return `"${test.replace(/"/g, '\\"')}"`;
    } else {
        // Assume using PowerShell
        return `'${test.replace(/"/g, '\\"')}'`;
    }
}
