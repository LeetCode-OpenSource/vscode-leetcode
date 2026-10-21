// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as vscode from "vscode";
import { fetchQuestionDetail } from "../api/question";
import { getLeetCodeRequest } from "../api/request";
import { testSolution as testWithLeetCode } from "../api/submission";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, IQuickItemEx, UserStatus } from "../shared";
import { getLanguageFromText, getNodeIdFromText } from "../utils/problemUtils";
import { DialogType, promptForOpenOutputChannel, showFileSelectDialog } from "../utils/uiUtils";
import { getActiveDocument } from "../utils/workspaceUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";
import * as list from "./list";

export async function testSolution(uri?: vscode.Uri): Promise<void> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return;
        }

        const document: vscode.TextDocument | undefined = await getActiveDocument(uri);
        if (!document) {
            return;
        }

        const code: string = document.getText();
        const language: string | undefined = getLanguageFromText(code);
        const id: string = getNodeIdFromText(code) || path.basename(document.uri.fsPath).split(".")[0];
        if (!language) {
            vscode.window.showErrorMessage("Failed to read the language from the @lc header.");
            return;
        }

        const problem: IProblem | undefined = (await list.listProblems()).find((item: IProblem) => item.id === id);
        if (!problem) {
            vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
            return;
        }

        const detail = await fetchQuestionDetail(getLeetCodeRequest(), problem.slug);
        const testInput: string | undefined = await pickTestInput(document, detail.sampleTestCase);
        if (testInput === undefined) {
            return;
        }
        if (!testInput.trim()) {
            vscode.window.showErrorMessage("The test input must not be empty.");
            return;
        }

        const result = await testWithLeetCode(
            getLeetCodeRequest(),
            { slug: problem.slug, questionId: detail.questionId },
            language,
            code,
            testInput,
        );
        leetCodeSubmissionProvider.show(result);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);
    }
}

async function pickTestInput(
    document: vscode.TextDocument,
    sampleTestCase: string | undefined,
): Promise<string | undefined> {
    const picks: Array<IQuickItemEx<string>> = [
        {
            label: "$(three-bars) Default test cases",
            description: "",
            detail: "Test with the problem's sample case",
            value: ":default",
        },
        {
            label: "$(pencil) Write directly...",
            description: "",
            detail: "Write test cases in an input box",
            value: ":direct",
        },
        {
            label: "$(file-text) Browse...",
            description: "",
            detail: "Test with test cases in a file",
            value: ":file",
        },
    ];

    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
    if (!choice) {
        return undefined;
    }

    if (choice.value === ":default") {
        return sampleTestCase || "";
    }

    if (choice.value === ":direct") {
        const value: string | undefined = await vscode.window.showInputBox({
            prompt: "Enter the test cases.",
            validateInput: (input: string): string | undefined => input && input.trim() ? undefined : "Test case must not be empty.",
            placeHolder: "Example: [1,2,3]\\n4",
            ignoreFocusOut: true,
        });
        return value === undefined ? undefined : normalizeTestInput(value);
    }

    const files: vscode.Uri[] | undefined = await showFileSelectDialog(document.uri.fsPath);
    if (!files || files.length === 0) {
        return undefined;
    }
    const bytes: Uint8Array = await vscode.workspace.fs.readFile(files[0]);
    return Buffer.from(bytes).toString("utf8").trim();
}

function normalizeTestInput(input: string): string {
    return input.replace(/\\n/g, "\n");
}
