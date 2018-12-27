// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { executeCommand } from "./cpUtils";

export function useWsl(): boolean {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    return process.platform === "win32" && leetCodeConfig.get<boolean>("useWsl") === true;
}

export async function toWslPath(path: string): Promise<string> {
    return (await executeCommand("wsl", ["wslpath", "-u", `"${path.replace(/\\/g, "/")}"`])).trim();
}

export async function toWinPath(path: string): Promise<string> {
    return (await executeCommand("wsl", ["wslpath", "-w", `"${path}"`])).trim();
}
