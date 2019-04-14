// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ViewColumn } from "vscode";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";

class LeetCodeSubmissionProvider extends LeetCodeWebview {

    private result: string;

    public async show(result: string): Promise<void> {
        this.result = result;
        if (this.showWebviewInternal()) {
            this.panel.reveal(ViewColumn.Two);
        }
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        return {
            viewType: "leetcode.submission",
            title: "Submission",
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
}

export const leetCodeSubmissionProvider: LeetCodeSubmissionProvider = new LeetCodeSubmissionProvider();
