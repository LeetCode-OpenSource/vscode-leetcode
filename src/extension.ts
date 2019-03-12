// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { codeLensProvider } from "./codeLensProvider";
import * as cache from "./commands/cache";
import { switchDefaultLanguage } from "./commands/language";
import * as plugin from "./commands/plugin";
import * as session from "./commands/session";
import * as show from "./commands/show";
import * as submit from "./commands/submit";
import * as test from "./commands/test";
import { LeetCodeNode } from "./explorer/LeetCodeNode";
import { LeetCodeTreeDataProvider } from "./explorer/LeetCodeTreeDataProvider";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodePreviewProvider } from "./leetCodePreviewProvider";
import { leetCodeResultProvider } from "./leetCodeResultProvider";
import { leetCodeSolutionProvider } from "./leetCodeSolutionProvider";
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
    leetCodePreviewProvider.initialize(context);
    leetCodeResultProvider.initialize(context);
    leetCodeSolutionProvider.initialize(context);

    context.subscriptions.push(
        leetCodeStatusBarItem,
        leetCodeChannel,
        leetCodePreviewProvider,
        leetCodeResultProvider,
        leetCodeSolutionProvider,
        vscode.window.createTreeView("leetCodeExplorer", { treeDataProvider: leetCodeTreeDataProvider, showCollapseAll: true }),
        vscode.languages.registerCodeLensProvider({ scheme: "file" }, codeLensProvider),
        vscode.commands.registerCommand("leetcode.deleteCache", () => cache.deleteCache()),
        vscode.commands.registerCommand("leetcode.toggleLeetCodeCn", () => plugin.switchEndpoint()),
        vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn()),
        vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut()),
        vscode.commands.registerCommand("leetcode.selectSessions", () => session.selectSession()),
        vscode.commands.registerCommand("leetcode.createSession", () => session.createSession()),
        vscode.commands.registerCommand("leetcode.previewProblem", (node: LeetCodeNode) => leetCodePreviewProvider.preview(node)),
        vscode.commands.registerCommand("leetcode.showProblem", (node: LeetCodeNode) => show.showProblem(node)),
        vscode.commands.registerCommand("leetcode.searchProblem", () => show.searchProblem()),
        vscode.commands.registerCommand("leetcode.showSolution", (node: LeetCodeNode) => show.showSolution(node)),
        vscode.commands.registerCommand("leetcode.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
        vscode.commands.registerCommand("leetcode.testSolution", (uri?: vscode.Uri) => test.testSolution(uri)),
        vscode.commands.registerCommand("leetcode.submitSolution", (uri?: vscode.Uri) => submit.submitSolution(uri)),
        vscode.commands.registerCommand("leetcode.switchDefaultLanguage", () => switchDefaultLanguage()),
    );

    await leetCodeExecutor.switchEndpoint(plugin.getLeetCodeEndpoint());
    leetCodeManager.getLoginStatus();
}

export function deactivate(): void {
    // Do nothing.
}
