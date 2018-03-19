"use strict";

import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

export async function selectWorkspaceFolder(): Promise<string> {
    let folder: vscode.WorkspaceFolder | undefined;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        if (vscode.workspace.workspaceFolders.length > 1) {
            folder = await vscode.window.showWorkspaceFolderPick({
                placeHolder: "Select the working directory you wish to use",
            });
        } else {
            folder = vscode.workspace.workspaceFolders[0];
        }
    }
    return folder ? folder.uri.fsPath : path.join(os.homedir(), ".leetcode");
}

export async function getActivefilePath(uri?: vscode.Uri): Promise<string | undefined> {
    let textEditor: vscode.TextEditor | undefined;
    if (uri) {
        textEditor = await vscode.window.showTextDocument(uri, { preview: false });
    } else {
        textEditor = vscode.window.activeTextEditor;
    }

    if (!textEditor) {
        return undefined;
    }
    if (textEditor.document.isDirty && !await textEditor.document.save()) {
        vscode.window.showWarningMessage("Please save the solution file first.");
        return undefined;
    }
    return textEditor.document.uri.fsPath;
}
