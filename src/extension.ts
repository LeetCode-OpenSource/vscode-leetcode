"use strict";

import * as vscode from "vscode";
import * as session from "./commands/session";
import * as show from "./commands/show";
import * as submit from "./commands/submit";
import { leetcodeChannel } from "./leetCodeChannel";
import { LeetCodeNode, LeetCodeTreeDataProvider } from "./leetCodeExplorer";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarItem } from "./leetCodeStatusBarItem";

export function activate(context: vscode.ExtensionContext) {
    leetCodeManager.getLoginStatus();
    const leetCodeTreeDataProvider: LeetCodeTreeDataProvider = new LeetCodeTreeDataProvider(context);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("leetCodeExplorer", leetCodeTreeDataProvider),
        vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn()),
        vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut()),
        vscode.commands.registerCommand("leetcode.selectSessions", () => session.selectSession()),
        vscode.commands.registerCommand("leetcode.showProblem", (node: LeetCodeNode) => show.showProblem(node)),
        vscode.commands.registerCommand("leetcode.searchProblem", () => show.searchProblem()),
        vscode.commands.registerCommand("leetcode.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
        vscode.commands.registerCommand("leetcode.submitSolution", () => submit.submitSolution()),
    );
    leetCodeManager.on("statusChanged", () => {
        leetCodeStatusBarItem.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
        leetCodeTreeDataProvider.refresh();
    });
}

export function deactivate() {
    leetcodeChannel.dispose();
    leetCodeStatusBarItem.dispose();
}
