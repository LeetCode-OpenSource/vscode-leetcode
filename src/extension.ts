"use strict";

import * as vscode from "vscode";
import * as session from "./commands/session";
import * as show from "./commands/show";
import * as submit from "./commands/submit";
import { LeetCodeNode, LeetCodeTreeDataProvider } from "./leetCodeExplorer";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarItem } from "./leetCodeStatusBarItem";
import { isNodeInstalled } from "./utils/nodeUtils";

export async function activate(context: vscode.ExtensionContext) {
    const channel: vscode.OutputChannel = vscode.window.createOutputChannel("LeetCode");
    if (!await isNodeInstalled(channel)) {
        return;
    }
    leetCodeManager.getLoginStatus(channel);
    const leetCodeTreeDataProvider: LeetCodeTreeDataProvider = new LeetCodeTreeDataProvider(context, channel);

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("leetCodeExplorer", leetCodeTreeDataProvider),
        vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn(channel)),
        vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut(channel)),
        vscode.commands.registerCommand("leetcode.selectSessions", () => session.selectSession(channel)),
        vscode.commands.registerCommand("leetcode.createSession", () => session.createSession(channel)),
        vscode.commands.registerCommand("leetcode.showProblem", (node: LeetCodeNode) => show.showProblem(channel, node)),
        vscode.commands.registerCommand("leetcode.searchProblem", () => show.searchProblem(channel)),
        vscode.commands.registerCommand("leetcode.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
        vscode.commands.registerCommand("leetcode.submitSolution", () => submit.submitSolution(channel)),
    );

    leetCodeManager.on("statusChanged", () => {
        leetCodeStatusBarItem.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
        leetCodeTreeDataProvider.refresh();
    });
}

export function deactivate() {
    leetCodeStatusBarItem.dispose();
}
