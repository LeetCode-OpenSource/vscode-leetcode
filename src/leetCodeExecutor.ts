"use strict";

import * as path from "path";
import * as wsl from "./utils/wslUtils";

export interface ILeetCodeExecutor {
    listProblems(showLocked: boolean): Promise<string>;

    listSessions(): Promise<string>;
    enableSession(name: string): Promise<string>;
    createSession(name: string): Promise<string>;
}

class LeetCodeExecutor implements ILeetCodeExecutor {
    private leetCodeBinaryPath: string;
    private leetCodeBinaryPathInWsl: string;

    constructor() {
        this.leetCodeBinaryPath = `"${path.join(__dirname, "..", "..", "node_modules", "leetcode-cli", "bin", "leetcode")}"`;
        this.leetCodeBinaryPathInWsl = "";
    }

    public async getLeetCodeBinaryPath(): Promise<string> {
        if (wsl.useWsl()) {
            if (!this.leetCodeBinaryPathInWsl) {
                this.leetCodeBinaryPathInWsl = await wsl.toWslPath(this.leetCodeBinaryPath);
            }
            return this.leetCodeBinaryPathInWsl;
        }
        return this.leetCodeBinaryPath;
    }

    public async listProblems(showLocked: boolean): Promise<string> {
        return await wsl.executeCommandEx("node", showLocked ?
            [await this.getLeetCodeBinaryPath(), "list"] :
            [await this.getLeetCodeBinaryPath(), "list", "-q", "L"],
        );
    }

    public async listSessions(): Promise<string> {
        return await wsl.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "session"]);
    }

    public async enableSession(name: string): Promise<string> {
        return await wsl.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "session", "-e", name]);
    }

    public async createSession(name: string): Promise<string> {
        return await wsl.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "session", "-c", name]);
    }
}

export const leetCodeExecutor: ILeetCodeExecutor = new LeetCodeExecutor();
