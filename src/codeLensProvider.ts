// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

class CodeLensProvider implements vscode.CodeLensProvider {

    private validFileNamePattern: RegExp = /\d+\..*\.(.+)/;

    public provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
        const fileName: string = document.fileName.trim();
        const matchResult: RegExpMatchArray | null = fileName.match(this.validFileNamePattern);
        if (!matchResult) {
            return undefined;
        }

        const range: vscode.Range = new vscode.Range(document.lineCount - 1, 0, document.lineCount - 1, 0);

        const lens: vscode.CodeLens = new vscode.CodeLens(range, {
            title: "🙏 Submit to LeetCode",
            command: "leetcode.submitSolution",
        });

        return [lens];
    }
}

export const codeLensProvider: CodeLensProvider = new CodeLensProvider();
