// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { markdownEngine } from "./markdownEngine";

class LeetCodeResultProvider implements Disposable {

    private context: ExtensionContext;
    private panel: WebviewPanel | undefined;

    public initialize(context: ExtensionContext): void {
        this.context = context;
    }

    public async show(result: string): Promise<void> {
        if (!this.panel) {
            this.panel = window.createWebviewPanel("leetcode.result", "LeetCode Results", ViewColumn.Two, {
                retainContextWhenHidden: true,
                enableFindWidget: true,
                localResourceRoots: markdownEngine.localResourceRoots,
            });

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);
        }

        this.panel.webview.html = await this.provideHtmlContent(result);
        this.panel.reveal(ViewColumn.Two);
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private async provideHtmlContent(result: string): Promise<string> {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${markdownEngine.getStyles()}
            </head>
            <body>
                <pre><code>${result.trim()}</code></pre>
            </body>
            </html>`;
    }
}

export const leetCodeResultProvider: LeetCodeResultProvider = new LeetCodeResultProvider();
