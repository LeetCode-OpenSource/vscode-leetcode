"use strict";

import * as vscode from "vscode";
import * as session from "./commands/session";
import { leetcodeChannel } from "./leetCodeChannel";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarItem } from "./leetCodeStatusBarItem";

export function activate(context: vscode.ExtensionContext) {
    leetCodeManager.getLoginStatus();
    context.subscriptions.push(
        vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn()),
        vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut()),
        vscode.commands.registerCommand("leetcode.selectSessions", () => session.selectSession()),
    );
}

export function deactivate() {
    leetcodeChannel.dispose();
    leetCodeStatusBarItem.dispose();
}
