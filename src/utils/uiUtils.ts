"use strict";

import * as fse from "fs-extra";
import * as opn from "opn";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { isLeetCodeCnEnabled } from "../commands/plugin";
import { leetCodeChannel } from "../leetCodeChannel";

export namespace DialogOptions {
    export const open: vscode.MessageItem = { title: "Open" };
    export const yes: vscode.MessageItem = { title: "Yes" };
    export const no: vscode.MessageItem = { title: "No", isCloseAffordance: true };
    export const never: vscode.MessageItem = { title: "Never" };
    export const singUp: vscode.MessageItem = { title: "Sign up" };
}

export async function promptForOpenOutputChannel(message: string, type: DialogType): Promise<void> {
    let result: vscode.MessageItem | undefined;
    switch (type) {
        case DialogType.info:
            result = await vscode.window.showInformationMessage(message, DialogOptions.open, DialogOptions.no);
            break;
        case DialogType.warning:
            result = await vscode.window.showWarningMessage(message, DialogOptions.open, DialogOptions.no);
            break;
        case DialogType.error:
            result = await vscode.window.showErrorMessage(message, DialogOptions.open, DialogOptions.no);
            break;
        default:
            break;
    }

    if (result === DialogOptions.open) {
        leetCodeChannel.show();
    }
}

export async function promptForSignIn(): Promise<void> {
    const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
        "Please sign in to LeetCode.",
        DialogOptions.yes,
        DialogOptions.no,
        DialogOptions.singUp,
    );
    switch (choice) {
        case DialogOptions.yes:
            await vscode.commands.executeCommand("leetcode.signin");
            break;
        case DialogOptions.singUp:
            if (isLeetCodeCnEnabled()) {
                opn("https://leetcode-cn.com");
            } else {
                opn("https://leetcode.com");
            }
            break;
        default:
            break;
    }
}

export async function showFileSelectDialog(): Promise<vscode.Uri[] | undefined> {
    const defaultUri: vscode.Uri | undefined = vscode.workspace.rootPath ? vscode.Uri.file(vscode.workspace.rootPath) : undefined;
    const options: vscode.OpenDialogOptions = {
        defaultUri,
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: "Select",
    };
    return await vscode.window.showOpenDialog(options);
}

export async function showResultFile(result: string): Promise<void> {
    const resultPath: string = path.join(os.homedir(), ".leetcode", "Result");
    await fse.ensureFile(resultPath);
    await fse.writeFile(resultPath, result);
    await vscode.window.showTextDocument(vscode.Uri.file(resultPath));
}

export enum DialogType {
    info = "info",
    warning = "warning",
    error = "error",
}
