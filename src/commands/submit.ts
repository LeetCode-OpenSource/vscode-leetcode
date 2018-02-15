"use strict";

import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { leetCodeManager } from "../leetCodeManager";
import { leetCodeBinaryPath } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";

export async function submitSolution(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const textEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    if (!textEditor) {
        return;
    }
    if (!textEditor.document.save()) {
        vscode.window.showWarningMessage("Please save the solution file first.");
        return;
    }
    const filePath: string = textEditor.document.uri.fsPath;
    try {
        const result: string = await executeCommand("node", [leetCodeBinaryPath, "submit", filePath]);
        const resultPath: string = path.join(os.tmpdir(), "Result");
        await fse.ensureFile(resultPath);
        await fse.writeFile(resultPath, result);
        await vscode.window.showTextDocument(vscode.Uri.file(resultPath));
    } catch (error) {
        await promptForOpenOutputChannel("Failed to submit the solution. Please open the output channel for details", DialogType.error);
    }
}
