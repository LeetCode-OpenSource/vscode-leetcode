// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { explorerNodeManager } from "../explorer/explorerNodeManager";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { getEditorShortcuts } from "../utils/settingUtils";

export class CustomCodeLensProvider implements vscode.CodeLensProvider {

    private onDidChangeCodeLensesEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

    get onDidChangeCodeLenses(): vscode.Event<void> {
        return this.onDidChangeCodeLensesEmitter.event;
    }

    public refresh(): void {
        this.onDidChangeCodeLensesEmitter.fire();
    }

    public provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
        const shortcuts: string[] = getEditorShortcuts();
        if (!shortcuts) {
            return;
        }

        const content: string = document.getText();
        const matchResult: RegExpMatchArray | null = content.match(/@lc app=.* id=(.*) lang=.*/);
        if (!matchResult) {
            return undefined;
        }
        const nodeId: string | undefined = matchResult[1];
        let node: LeetCodeNode | undefined;
        if (nodeId) {
            node = explorerNodeManager.getNodeById(nodeId);
        }

        let codeLensLine: number = document.lineCount - 1;
        for (let i: number = document.lineCount - 1; i >= 0; i--) {
            const lineContent: string = document.lineAt(i).text;
            if (lineContent.indexOf("@lc code=end") >= 0) {
                codeLensLine = i;
                break;
            }
        }

        const range: vscode.Range = new vscode.Range(codeLensLine, 0, codeLensLine, 0);
        const codeLens: vscode.CodeLens[] = [];
        // support customized shortcut order
        for (let i: number = 0; i < shortcuts.length; i++) {
            let title, command, args;
            let willPush = true;
            switch(shortcuts[i]){
                case "submit":
                    title = "Submit";
                    command = "leetcode.submitSolution";
                    args = [document.uri];
                    break;
                case "test":
                    title = "Test";
                    command = "leetcode.testSolution";
                    args = [document.uri];
                    break;
                case "star":
                    if(!node){
                        willPush = false;
                        break;
                    }
                    title = node.isFavorite ? "Unstar" : "Star";
                    command = node.isFavorite ? "leetcode.removeFavorite" : "leetcode.addFavorite";
                    args = [node];
                    break;
                case "solution":
                    title = "Solution";
                    command = "leetcode.showSolution";
                    args = [document.uri];
                    break;
                case "description":
                    title = "Description";
                    command = "leetcode.previewProblem";
                    args = [document.uri];
                    break;
                default:
                    willPush = false;
                    break;
            }
            if(!willPush){
                continue;
            }
            codeLens.push(new vscode.CodeLens(range, {
                    title: title,
                    command: command,
                    arguments: args,
                }));
        }

        /*
        if (shortcuts.indexOf("submit") >= 0) {
            codeLens.push(new vscode.CodeLens(range, {
                title: "Submit",
                command: "leetcode.submitSolution",
                arguments: [document.uri],
            }));
        }

        if (shortcuts.indexOf("test") >= 0) {
            codeLens.push(new vscode.CodeLens(range, {
                title: "Test",
                command: "leetcode.testSolution",
                arguments: [document.uri],
            }));
        }

        if (shortcuts.indexOf("star") >= 0 && node) {
            codeLens.push(new vscode.CodeLens(range, {
                title: node.isFavorite ? "Unstar" : "Star",
                command: node.isFavorite ? "leetcode.removeFavorite" : "leetcode.addFavorite",
                arguments: [node],
            }));
        }

        if (shortcuts.indexOf("solution") >= 0) {
            codeLens.push(new vscode.CodeLens(range, {
                title: "Solution",
                command: "leetcode.showSolution",
                arguments: [document.uri],
            }));
        }

        if (shortcuts.indexOf("description") >= 0) {
            codeLens.push(new vscode.CodeLens(range, {
                title: "Description",
                command: "leetcode.previewProblem",
                arguments: [document.uri],
            }));
        }
        */

        return codeLens;
    }
}

export const customCodeLensProvider: CustomCodeLensProvider = new CustomCodeLensProvider();
