"use strict";

import * as vscode from "vscode";
import * as session from "./commands/session";
import { leetcodeChannel } from "./leetCodeChannel";
import { LeetCodeTreeDataProvider } from "./leetCodeExplorer";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarItem } from "./leetCodeStatusBarItem";

export function activate(context: vscode.ExtensionContext) {
    leetCodeManager.getLoginStatus();
    const leetCodeTreeDataProvider: LeetCodeTreeDataProvider = new LeetCodeTreeDataProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("leetCodeExplorer", leetCodeTreeDataProvider),
        vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn()),
        vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut()),
        vscode.commands.registerCommand("leetcode.selectSessions", () => session.selectSession()),
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
