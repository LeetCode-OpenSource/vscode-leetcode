// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as vscode from "vscode";
import { fetchQuestionDetail } from "../api/question";
import { getLeetCodeRequest } from "../api/request";
import { submitSolution as submitToLeetCode } from "../api/submission";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem } from "../shared";
import { getLanguageFromText, getNodeIdFromText } from "../utils/problemUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { getActiveDocument } from "../utils/workspaceUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";
import * as list from "./list";

export async function submitSolution(uri?: vscode.Uri): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
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

    try {
        const request = getLeetCodeRequest();
        const detail = await fetchQuestionDetail(request, problem.slug);
        const result = await submitToLeetCode(
            request,
            { slug: problem.slug, questionId: detail.questionId },
            language,
            code,
        );
        leetCodeSubmissionProvider.show(result);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to submit the solution. Please open the output channel for details.", DialogType.error);
        return;
    }

    leetCodeTreeDataProvider.refresh(true);
}
