// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { codeLensProvider } from "./codeLensProvider";
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
import { leetCodeResultProvider } from "./leetCodeResultProvider";
import { leetCodeStatusBarItem } from "./leetCodeStatusBarItem";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    if (!await leetCodeExecutor.meetRequirements()) {
        return;
    }

    leetCodeManager.on("statusChanged", () => {
        leetCodeStatusBarItem.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
        leetCodeTreeDataProvider.refresh();
    });

    const leetCodeTreeDataProvider: LeetCodeTreeDataProvider = new LeetCodeTreeDataProvider(context);
    leetCodeResultProvider.initialize(context);

    context.subscriptions.push(
        leetCodeStatusBarItem,
        leetCodeChannel,
        leetCodeResultProvider,
        vscode.window.registerTreeDataProvider("leetCodeExplorer", leetCodeTreeDataProvider),
        vscode.languages.registerCodeLensProvider({ scheme: "file" }, codeLensProvider),
        vscode.commands.registerCommand("leetcode.deleteCache", () => cache.deleteCache()),
        vscode.commands.registerCommand("leetcode.toogleLeetCodeCn", () => plugin.switchEndpoint()),
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

    await leetCodeExecutor.switchEndpoint(plugin.getLeetCodeEndpoint());
    leetCodeManager.getLoginStatus();
}

export function deactivate(): void {
    // Do nothing.
}
