"use strict";

import * as cp from "child_process";
import * as opn from "opn";
import * as path from "path";
import * as vscode from "vscode";
import { executeCommand, executeCommandWithProgress } from "./utils/cpUtils";
import { DialogOptions } from "./utils/uiUtils";
import * as wsl from "./utils/wslUtils";

export interface ILeetCodeExecutor {
    meetRequirements(): Promise<boolean>;
    getLeetCodeBinaryPath(): Promise<string>;

    /* section for user command */
    getUserInfo(): Promise<string>;
    signOut(): Promise<string>;
    // TODO: implement login when leetcode-cli support login in batch mode.
    // signIn(): Promise<string>;

    /* section for problem command */
    listProblems(showLocked: boolean): Promise<string>;
    showProblem(id: string, language: string, outdir: string): Promise<string>;

    /* section for session command */
    listSessions(): Promise<string>;
    enableSession(name: string): Promise<string>;
    createSession(name: string): Promise<string>;

    /* section for solution command */
    submitSolution(filePath: string): Promise<string>;
    testSolution(filePath: string, testString?: string): Promise<string>;

    /* section for plugin command */
    toggleLeetCodeCn(isEnable: boolean): Promise<string>;
}

class LeetCodeExecutor implements ILeetCodeExecutor {
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
                opn("https://nodejs.org");
            }
            return false;
        }
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

export const leetCodeExecutor: ILeetCodeExecutor = new LeetCodeExecutor();
