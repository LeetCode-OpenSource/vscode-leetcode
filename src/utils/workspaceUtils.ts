// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { IQuickItemEx } from "../shared";
import { getWorkspaceConfiguration, getWorkspaceFolder } from "./settingUtils";
import { showDirectorySelectDialog } from "./uiUtils";

export async function selectWorkspaceFolder(): Promise<string> {
    let workspaceFolderSetting: string = getWorkspaceFolder();
    if (workspaceFolderSetting.trim() === "") {
        workspaceFolderSetting = await determineLeetCodeFolder();
        if (workspaceFolderSetting === "") {
            // User cancelled
            return workspaceFolderSetting;
        }
    }
    let needAsk: boolean = true;
    await fse.ensureDir(workspaceFolderSetting);
    for (const folder of vscode.workspace.workspaceFolders || []) {
        if (isSubFolder(folder.uri.fsPath, workspaceFolderSetting)) {
            needAsk = false;
        }
    }

    if (needAsk) {
        const choice: string | undefined = await vscode.window.showQuickPick(
            [
                OpenOption.justOpenFile,
                OpenOption.openInCurrentWindow,
                OpenOption.openInNewWindow,
                OpenOption.addToWorkspace,
            ],
            { placeHolder: "The LeetCode workspace folder is not opened in VS Code, would you like to open it?" },
        );

        // Todo: generate file first
        switch (choice) {
            case OpenOption.justOpenFile:
                return workspaceFolderSetting;
            case OpenOption.openInCurrentWindow:
                await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(workspaceFolderSetting), false);
                return "";
            case OpenOption.openInNewWindow:
                await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(workspaceFolderSetting), true);
                return "";
            case OpenOption.addToWorkspace:
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, { uri: vscode.Uri.file(workspaceFolderSetting) });
                break;
            default:
                return "";
        }
    }

    return workspaceFolderSetting;
}

export async function getActiveFilePath(uri?: vscode.Uri): Promise<string | undefined> {
    const document: vscode.TextDocument | undefined = await getActiveDocument(uri);
    if (!document) {
        return undefined;
    }
    return document.uri.fsPath;
}

export async function getActiveDocument(uri?: vscode.Uri): Promise<vscode.TextDocument | undefined> {
    let document: vscode.TextDocument | undefined;
    if (uri) {
        document = await vscode.workspace.openTextDocument(uri);
    } else {
        document = vscode.window.activeTextEditor?.document;
    }

    if (!document) {
        return undefined;
    }
    if (document.isDirty && !await document.save()) {
        vscode.window.showWarningMessage("Please save the solution file first.");
        return undefined;
    }
    return document;
}

function isSubFolder(from: string, to: string): boolean {
    const relative: string = path.relative(from, to);
    if (relative === "") {
        return true;
    }
    return !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function determineLeetCodeFolder(): Promise<string> {
    let result: string;
    const picks: Array<IQuickItemEx<string>> = [];
    picks.push(
        {
            label: `Default location`,
            detail: `${path.join(os.homedir(), ".leetcode")}`,
            value: `${path.join(os.homedir(), ".leetcode")}`,
        },
        {
            label: "$(file-directory) Browse...",
            value: ":browse",
        },
    );
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
        picks,
        { placeHolder: "Select where you would like to save your LeetCode files" },
    );
    if (!choice) {
        result = "";
    } else if (choice.value === ":browse") {
        const directory: vscode.Uri[] | undefined = await showDirectorySelectDialog();
        if (!directory || directory.length < 1) {
            result = "";
        } else {
            result = directory[0].fsPath;
        }
    } else {
        result = choice.value;
    }

    getWorkspaceConfiguration().update("workspaceFolder", result, vscode.ConfigurationTarget.Global);

    return result;
}

enum OpenOption {
    justOpenFile = "Just open the problem file",
    openInCurrentWindow = "Open in current window",
    openInNewWindow = "Open in new window",
    addToWorkspace = "Add to workspace",
}
