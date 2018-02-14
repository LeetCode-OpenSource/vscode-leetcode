"use strict";

import * as os from "os";
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
    return folder ? folder.uri.fsPath : os.tmpdir();
}
