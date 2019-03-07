// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { Solution } from "./shared";

class LeetCodeSolutionProvider implements Disposable {

    private context: ExtensionContext;
    private panel: WebviewPanel | undefined;

    public initialize(context: ExtensionContext): void {
        this.context = context;
    }

    public async show(solutionString: string): Promise<void> {
        if (!this.panel) {
            this.panel = window.createWebviewPanel("leetCode", "Top voted solution", ViewColumn.Active, {
                retainContextWhenHidden: true,
                enableFindWidget: true,
            });

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);
        }

        const solution: Solution = this.parseSolution(solutionString);
        this.panel.title = solution.title;
        this.panel.webview.html = this.getWebViewContent(solution.body);
        this.panel.reveal(ViewColumn.Active);
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private parseSolution(raw: string): Solution {
        const solution: Solution = new Solution();
        // [^] matches everything including \n, yet can be replaced by . in ES2018's `m` flag
        raw = raw.slice(1); // skip first empty line
        [solution.title, raw] = raw.split(/\n\n([^]+)/); // parse title and skip one line
        [solution.url, raw] = raw.split(/\n\n([^]+)/); // parse url and skip one line
        [solution.lang, raw] = raw.match(/\* Lang:\s+(.+)\n([^]+)/)!.slice(1);
        [solution.author, raw] = raw.match(/\* Author:\s+(.+)\n([^]+)/)!.slice(1);
        [solution.votes, raw] = raw.match(/\* Votes:\s+(\d+)\n\n([^]+)/)!.slice(1);
        solution.body = raw;
        return solution;
    }

    private getWebViewContent(result: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LeetCode Top Voted Solution</title>
            </head>
            <body>
                <pre>${result}</pre>
            </body>
            </html>
        `;
    }
}

export const leetCodeSolutionProvider: LeetCodeSolutionProvider = new LeetCodeSolutionProvider();
