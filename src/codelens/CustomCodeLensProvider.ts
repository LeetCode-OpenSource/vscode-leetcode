// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
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

        const fileName: string = document.fileName.trim();
        const matchResult: RegExpMatchArray | null = fileName.match(/\d+\..*\.(.+)/);
        if (!matchResult) {
            return undefined;
        }

        const range: vscode.Range = new vscode.Range(document.lineCount - 1, 0, document.lineCount - 1, 0);
        const codeLens: vscode.CodeLens[] = [];

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

        return codeLens;
    }
}
