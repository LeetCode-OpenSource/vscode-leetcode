"use strict";

import * as vscode from "vscode";
import * as session from "./commands/session";
import * as user from "./commands/user";
import { leetcodeChannel } from "./leetCodeChannel";
import { leetCodeStatusBarItem } from "./leetCodeStatusBarItem";

export function activate(context: vscode.ExtensionContext) {
    const terminal: vscode.Terminal = vscode.window.createTerminal("LeetCode");
    context.subscriptions.push(
        terminal,
        vscode.commands.registerCommand("leetcode.signin", () => user.signIn()),
        vscode.commands.registerCommand("leetcode.signout", () => user.signOut()),
        vscode.commands.registerCommand("leetcode.selectSessions", () => session.selectSession()),
    );
}

export function deactivate() {
    leetcodeChannel.dispose();
    leetCodeStatusBarItem.dispose();
}
