// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";
import * as fse from "fs-extra";
import * as path from "path";
import * as requireFromString from "require-from-string";
import * as vscode from "vscode";
import { Endpoint, IProblem } from "./shared";
import { executeCommand, executeCommandWithProgress } from "./utils/cpUtils";
import { genFileName } from "./utils/problemUtils";
import { DialogOptions, openUrl } from "./utils/uiUtils";
import * as wsl from "./utils/wslUtils";

class LeetCodeExecutor {
    private leetCodeRootPath: string;
    private leetCodeRootPathInWsl: string;

    constructor() {
        this.leetCodeRootPath = path.join(__dirname, "..", "..", "node_modules", "vsc-leetcode-cli");
        this.leetCodeRootPathInWsl = "";
    }

    public async getLeetCodeRootPath(): Promise<string> { // not wrapped by ""
        if (wsl.useWsl()) {
            if (!this.leetCodeRootPathInWsl) {
                this.leetCodeRootPathInWsl = `${await wsl.toWslPath(this.leetCodeRootPath)}`;
            }
            return `${this.leetCodeRootPathInWsl}`;
        }
        return `${this.leetCodeRootPath}`;
    }

    public async getLeetCodeBinaryPath(): Promise<string> { // wrapped by ""
        return `"${path.join(await this.getLeetCodeRootPath(), "bin", "leetcode")}"`;
    }

    public async meetRequirements(): Promise<boolean> {
        try {
            await this.executeCommandEx("node", ["-v"]);
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
        try { // Check company plugin
            await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "plugin", "-e", "company"]);
        } catch (error) { // Download company plugin and activate
            await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "plugin", "-i", "company"]);
        }
        return true;
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

    public async showProblem(problemNode: IProblem, language: string, outDir: string): Promise<string> {
        const fileName: string = genFileName(problemNode, language);
        const filePath: string = path.join(outDir, fileName);

        if (!await fse.pathExists(filePath)) {
            const codeTemplate: string = await this.executeCommandWithProgressEx("Fetching problem data...", "node", [await this.getLeetCodeBinaryPath(), "show", problemNode.id, "-cx", "-l", language]);
            await fse.writeFile(filePath, codeTemplate);
        }

        return filePath;
    }

    public async getDescription(problemNode: IProblem): Promise<string> {
        return await this.executeCommandWithProgressEx("Fetching problem description...", "node", [await this.getLeetCodeBinaryPath(), "show", problemNode.id, "-x"]);
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
            return await this.executeCommandWithProgressEx("Submitting to LeetCode...", "node", [await this.getLeetCodeBinaryPath(), "test", `"${filePath}"`, "-t", `${testString}`]);
        }
        return await this.executeCommandWithProgressEx("Submitting to LeetCode...", "node", [await this.getLeetCodeBinaryPath(), "test", `"${filePath}"`]);
    }

    public async switchEndpoint(endpoint: string): Promise<string> {
        switch (endpoint) {
            case Endpoint.LeetCodeCN:
                return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "plugin", "-e", "leetcode.cn"]);
            case Endpoint.LeetCode:
            default:
                return await this.executeCommandEx("node", [await this.getLeetCodeBinaryPath(), "plugin", "-d", "leetcode.cn"]);
        }
    }

    public async getCompaniesAndTags(): Promise<{ companies: { [key: string]: string[] }, tags: { [key: string]: string[] } }> {
        // preprocess the plugin source
        const companiesTagsPath: string = path.join(await leetCodeExecutor.getLeetCodeRootPath(), "lib", "plugins", "company.js");
        const companiesTagsSrc: string = (await fse.readFile(companiesTagsPath, "utf8")).replace(
            "module.exports = plugin",
            "module.exports = { COMPONIES, TAGS }",
        );
        const { COMPONIES, TAGS } = requireFromString(companiesTagsSrc, companiesTagsPath);
        return { companies: COMPONIES, tags: TAGS };
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
