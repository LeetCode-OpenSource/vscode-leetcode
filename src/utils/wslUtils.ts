"use strict";

import * as cp from "child_process";
import * as vscode from "vscode";

export function useWsl(): boolean {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");

    return process.platform === "win32" && leetCodeConfig.get<boolean>("useWsl") === true;
}

export function toWslPath(path: string): string {
    return cp.execFileSync("wsl", ["wslpath", "-u", `${path.replace(/\\/g, "/")}`]).toString().trim();
}

export function toWinPath(path: string): string {
    return cp.execFileSync("wsl", ["wslpath", "-w", path]).toString().trim();
}
