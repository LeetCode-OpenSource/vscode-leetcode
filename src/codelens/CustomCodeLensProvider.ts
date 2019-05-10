// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

export class CustomCodeLensProvider implements vscode.CodeLensProvider {

    private validFileNamePattern: RegExp = /\d+\..*\.(.+)/;

    public provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
        const fileName: string = document.fileName.trim();
        const matchResult: RegExpMatchArray | null = fileName.match(this.validFileNamePattern);
        if (!matchResult) {
            return undefined;
        }

        const range: vscode.Range = new vscode.Range(document.lineCount - 1, 0, document.lineCount - 1, 0);

        return [
            new vscode.CodeLens(range, {
                title: "Submit",
                command: "leetcode.submitSolution",
                arguments: [document.uri],
            }),
            new vscode.CodeLens(range, {
                title: "Test",
                command: "leetcode.testSolution",
                arguments: [document.uri],
            }),
            new vscode.CodeLens(range, {
                title: "Solution",
                command: "leetcode.showSolution",
                arguments: [document.uri],
            }),
        ];
    }
}
