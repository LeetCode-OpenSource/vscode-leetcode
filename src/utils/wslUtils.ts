// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { executeCommand } from "./cpUtils";
import { isWindows } from "./osUtils";

export function useWsl(): boolean {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    return isWindows() && leetCodeConfig.get<boolean>("useWsl") === true;
}

export async function toWslPath(path: string): Promise<string> {
    return (await executeCommand("wsl", ["wslpath", "-u", `"${path.replace(/\\/g, "/")}"`])).trim();
}

export async function toWinPath(path: string): Promise<string> {
    if (path.startsWith("\\mnt\\")) {
        return (await executeCommand("wsl", ["wslpath", "-w", `"${path.replace(/\\/g, "/").substr(0, 6)}"`])).trim() + path.substr(7);
    }
    return (await executeCommand("wsl", ["wslpath", "-w", "/"])).trim() + path;
}
