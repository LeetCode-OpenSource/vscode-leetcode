// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { codeLensController } from "./codelens/CodeLensController";
import * as cache from "./commands/cache";
import { switchDefaultLanguage } from "./commands/language";
import * as plugin from "./commands/plugin";
import * as session from "./commands/session";
import * as show from "./commands/show";
import * as star from "./commands/star";
import * as submit from "./commands/submit";
import * as test from "./commands/test";
import { explorerNodeManager } from "./explorer/explorerNodeManager";
import { LeetCodeNode } from "./explorer/LeetCodeNode";
import { leetCodeTreeDataProvider } from "./explorer/LeetCodeTreeDataProvider";
import { leetCodeTreeItemDecorationProvider } from "./explorer/LeetCodeTreeItemDecorationProvider";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarController } from "./statusbar/leetCodeStatusBarController";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { leetCodePreviewProvider } from "./webview/leetCodePreviewProvider";
import { leetCodeSolutionProvider } from "./webview/leetCodeSolutionProvider";
import { leetCodeSubmissionProvider } from "./webview/leetCodeSubmissionProvider";
import { markdownEngine } from "./webview/markdownEngine";
import TrackData from "./utils/trackingUtils";
import { globalState } from "./globalState";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        if (!(await leetCodeExecutor.meetRequirements(context))) {
            throw new Error("The environment doesn't meet requirements.");
        }

        leetCodeManager.on("statusChanged", () => {
            leetCodeStatusBarController.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
            leetCodeTreeDataProvider.refresh();
        });

        leetCodeTreeDataProvider.initialize(context);
        globalState.initialize(context);

        context.subscriptions.push(
            leetCodeStatusBarController,
            leetCodeChannel,
            leetCodePreviewProvider,
            leetCodeSubmissionProvider,
            leetCodeSolutionProvider,
            leetCodeExecutor,
            markdownEngine,
            codeLensController,
            explorerNodeManager,
            vscode.window.registerFileDecorationProvider(leetCodeTreeItemDecorationProvider),
            vscode.window.createTreeView("leetCodeExplorer", { treeDataProvider: leetCodeTreeDataProvider, showCollapseAll: true }),
            vscode.commands.registerCommand("leetcode.deleteCache", () => cache.deleteCache()),
            vscode.commands.registerCommand("leetcode.toggleLeetCodeCn", () => plugin.switchEndpoint()),
            vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn()),
            vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut()),
            vscode.commands.registerCommand("leetcode.manageSessions", () => session.manageSessions()),
            vscode.commands.registerCommand("leetcode.previewProblem", (node: LeetCodeNode) => {
                TrackData.report({
                    event_key: `vscode_open_problem`,
                    type: "click",
                    extra: JSON.stringify({
                        problem_id: node.id,
                        problem_name: node.name,
                    }),
                });
                show.previewProblem(node);
            }),
            vscode.commands.registerCommand("leetcode.showProblem", (node: LeetCodeNode) => show.showProblem(node)),
            vscode.commands.registerCommand("leetcode.pickOne", () => show.pickOne()),
            vscode.commands.registerCommand("leetcode.searchProblem", () => show.searchProblem()),
            vscode.commands.registerCommand("leetcode.showSolution", (input: LeetCodeNode | vscode.Uri) => show.showSolution(input)),
            vscode.commands.registerCommand("leetcode.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
            vscode.commands.registerCommand("leetcode.testSolution", (uri?: vscode.Uri) => {
                TrackData.report({
                    event_key: `vscode_runCode`,
                    type: "click",
                    extra: JSON.stringify({
                        path: uri?.path,
                    }),
                });
                return test.testSolution(uri);
            }),
            vscode.commands.registerCommand("leetcode.submitSolution", (uri?: vscode.Uri) => {
                TrackData.report({
                    event_key: `vscode_submit`,
                    type: "click",
                    extra: JSON.stringify({
                        path: uri?.path,
                    }),
                });
                return submit.submitSolution(uri);
            }),
            vscode.commands.registerCommand("leetcode.switchDefaultLanguage", () => switchDefaultLanguage()),
            vscode.commands.registerCommand("leetcode.addFavorite", (node: LeetCodeNode) => star.addFavorite(node)),
            vscode.commands.registerCommand("leetcode.removeFavorite", (node: LeetCodeNode) => star.removeFavorite(node)),
            vscode.commands.registerCommand("leetcode.problems.sort", () => plugin.switchSortingStrategy())
        );

        await leetCodeExecutor.switchEndpoint(plugin.getLeetCodeEndpoint());
        await leetCodeManager.getLoginStatus();
        vscode.window.registerUriHandler({ handleUri: leetCodeManager.handleUriSignIn });
    } catch (error) {
        leetCodeChannel.appendLine(error.toString());
        promptForOpenOutputChannel("Extension initialization failed. Please open output channel for details.", DialogType.error);
    }
}

export function deactivate(): void {
    // Do nothing.
}
