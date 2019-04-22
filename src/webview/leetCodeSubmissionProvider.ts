// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ViewColumn } from "vscode";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";

class LeetCodeSubmissionProvider extends LeetCodeWebview {

    protected readonly viewType: string = "leetcode.submission";
    private result: string;

    public show(result: string): void {
        this.result = result;
        this.showWebviewInternal();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        return {
            title: "Submission",
            viewColumn: ViewColumn.Two,
        };
    }

    protected getWebviewContent(): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${markdownEngine.getStyles()}
            </head>
            <body>
                <pre><code>${this.result.trim()}</code></pre>
            </body>
            </html>`;
    }

    protected onDidDisposeWebview(): void {
        super.onDidDisposeWebview();
        delete this.result;
    }
}

export const leetCodeSubmissionProvider: LeetCodeSubmissionProvider = new LeetCodeSubmissionProvider();
