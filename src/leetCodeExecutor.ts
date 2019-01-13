// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { executeCommand, executeCommandWithProgress } from "./utils/cpUtils";
import { DialogOptions, openUrl } from "./utils/uiUtils";
import * as wsl from "./utils/wslUtils";

class LeetCodeExecutor {
    private leetCodeBinaryPath: string;
    private leetCodeBinaryPathInWsl: string;

    constructor() {
        this.leetCodeBinaryPath = path.join(__dirname, "..", "..", "node_modules", "leetcode-cli", "bin", "leetcode");
        this.leetCodeBinaryPathInWsl = "";
    }

    public async getLeetCodeBinaryPath(): Promise<string> {
        if (wsl.useWsl()) {
            if (!this.leetCodeBinaryPathInWsl) {
                this.leetCodeBinaryPathInWsl = `${await wsl.toWslPath(this.leetCodeBinaryPath)}`;
            }
            return `"${this.leetCodeBinaryPathInWsl}"`;
        }
        return `"${this.leetCodeBinaryPath}"`;
    }

    public async meetRequirements(): Promise<boolean> {
        try {
            await this.executeCommandEx("node", ["-v"]);
            return true;
        } catch (error) {
            const choice: vscode.MessageItem | undefined = await vscode.window.showErrorMessage(
                "LeetCode extension needs Node.js installed in environment path",
                DialogOptions.open,
            );
            if (choice === DialogOptions.open) {
                openUrl("https://nodejs.org");
            }
            return false;
        }
    }

    public async deleteCache(): Promise<string> {
        return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "cache", "-d"]);
    }

    public async getUserInfo(): Promise<string> {
        return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "user"]);
    }

    public async signOut(): Promise<string> {
        return await await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "user", "-L"]);
    }

    public async listProblems(showLocked: boolean): Promise<string> {
        return await this.executeCommandEx("node", showLocked ?
            [await this.getLeetCodeBinaryPath(), "list"] :
            [await this.getLeetCodeBinaryPath(), "list", "-q", "L"],
        );
    }

    public async showProblem(id: string, language: string, outdir: string): Promise<string> {
        return await this.executeCommandWithProgressEx("Fetching problem data...", "node", [await this.getLeetCodeBinaryPath(), "show", id, "-gx", "-l", language, "-o", `"${outdir}"`]);
    }

    public async listSessions(): Promise<string> {
        return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "session"]);
    }

    public async enableSession(name: string): Promise<string> {
        return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "session", "-e", name]);
    }

    public async createSession(name: string): Promise<string> {
        return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "session", "-c", name]);
    }

    public async submitSolution(filePath: string): Promise<string> {
        return await this.executeCommandWithProgressEx("Submitting to LeetCode...", "node", [await this.getLeetCodeBinaryPath(), "submit", `"${filePath}"`]);
    }

    public async testSolution(filePath: string, testString?: string): Promise<string> {
        if (testString) {
            return await this.executeCommandWithProgressEx("Submitting to LeetCode...", "node", [await this.getLeetCodeBinaryPath(), "test", `"${filePath}"`, "-t", `"${testString}"`]);
        }
        return await this.executeCommandWithProgressEx("Submitting to LeetCode...", "node", [await this.getLeetCodeBinaryPath(), "test", `"${filePath}"`]);
    }

    public async toggleLeetCodeCn(isEnable: boolean): Promise<string> {
        if (isEnable) {
            return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "plugin", "-e", "leetcode.cn"]);
        }
        return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "plugin", "-d", "leetcode.cn"]);
    }

    private async executeCommandEx(command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
        if (wsl.useWsl()) {
            return await executeCommand("wsl", [command].concat(args), options);
        }
        return await executeCommand(command, args, options);
    }

    private async executeCommandWithProgressEx(message: string, command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
        if (wsl.useWsl()) {
            return await executeCommandWithProgress(message, "wsl", [command].concat(args), options);
        }
        return await executeCommandWithProgress(message, command, args, options);
    }
}

export const leetCodeExecutor: LeetCodeExecutor = new LeetCodeExecutor();
