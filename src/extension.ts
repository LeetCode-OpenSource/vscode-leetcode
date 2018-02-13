"use strict";

import * as vscode from "vscode";
import * as user from "./commands/user";

export function activate(context: vscode.ExtensionContext) {
    const terminal: vscode.Terminal = vscode.window.createTerminal("LeetCode");
    context.subscriptions.push(
        terminal,
        vscode.commands.registerCommand("leetcode.signin", () => user.signIn()),
        vscode.commands.registerCommand("leetcode.signout", () => user.signOut()),
    );
}

// tslint:disable-next-line:no-empty
export function deactivate() { }
