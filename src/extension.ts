"use strict";

import * as vscode from "vscode";
import * as cache from "./commands/cache";
import * as plugin from "./commands/plugin";
import * as session from "./commands/session";
import * as show from "./commands/show";
import * as submit from "./commands/submit";
import * as test from "./commands/test";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { LeetCodeNode, LeetCodeTreeDataProvider } from "./leetCodeExplorer";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarItem } from "./leetCodeStatusBarItem";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    if (!await leetCodeExecutor.meetRequirements()) {
        return;
    }
    leetCodeManager.getLoginStatus();
    const leetCodeTreeDataProvider: LeetCodeTreeDataProvider = new LeetCodeTreeDataProvider(context);

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("leetCodeExplorer", leetCodeTreeDataProvider),
        vscode.commands.registerCommand("leetcode.deleteCache", () => cache.deleteCache()),
        vscode.commands.registerCommand("leetcode.toogleLeetCodeCn", () => plugin.toogleLeetCodeCn()),
        vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn()),
        vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut()),
        vscode.commands.registerCommand("leetcode.selectSessions", () => session.selectSession()),
        vscode.commands.registerCommand("leetcode.createSession", () => session.createSession()),
        vscode.commands.registerCommand("leetcode.showProblem", (node: LeetCodeNode) => show.showProblem(node)),
        vscode.commands.registerCommand("leetcode.searchProblem", () => show.searchProblem()),
        vscode.commands.registerCommand("leetcode.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
        vscode.commands.registerCommand("leetcode.testSolution", (uri?: vscode.Uri) => test.testSolution(uri)),
        vscode.commands.registerCommand("leetcode.submitSolution", (uri?: vscode.Uri) => submit.submitSolution(uri)),
    );

    await plugin.initializeEndpoint();

    leetCodeManager.on("statusChanged", () => {
        leetCodeStatusBarItem.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
        leetCodeTreeDataProvider.refresh();
    });
}

export function deactivate(): void {
    leetCodeStatusBarItem.dispose();
    leetCodeChannel.dispose();
}
