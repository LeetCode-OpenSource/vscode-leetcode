"use strict";

import * as cp from "child_process";
import * as vscode from "vscode";
import { executeCommand, executeCommandWithProgress } from "./cpUtils";

const wslCommand: string = "wsl";

export function useWsl(): boolean {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    return process.platform === "win32" && leetCodeConfig.get<boolean>("useWsl") === true;
}

export async function toWslPath(path: string): Promise<string> {
    return (await executeCommand(wslCommand, ["wslpath", "-u", `"${path.replace(/\\/g, "/")}"`])).trim();
}

export async function toWinPath(path: string): Promise<string> {
    return (await executeCommand(wslCommand, ["wslpath", "-w", `"${path}"`])).trim();
}

export async function executeCommandEx(command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    if (useWsl()) {
        return await executeCommand(wslCommand, [command].concat(args), options);
    }
    return await executeCommand(command, args, options);
}

export async function executeCommandWithProgressEx(message: string, command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    if (useWsl()) {
        return await executeCommandWithProgress(message, wslCommand, [command].concat(args), options);
    }
    return await executeCommandWithProgress(message, command, args, options);
}
