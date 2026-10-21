// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ViewColumn } from "vscode";
import { getLeetCodeEndpoint } from "../commands/plugin";
import { Endpoint } from "../shared";
import { leetCodePreviewProvider } from "./leetCodePreviewProvider";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";

class LeetCodeSolutionProvider extends LeetCodeWebview {

    protected readonly viewType: string = "leetcode.solution";
    private title: string = "";
    private content: string = "";

    public show(title: string, content: string): void {
        this.title = title;
        this.content = content;
        this.showWebviewInternal();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        if (leetCodePreviewProvider.isSideMode()) {
            return {
                title: "Solution",
                viewColumn: ViewColumn.Two,
                preserveFocus: true,
            };
        } else {
            return {
                title: `Solution: ${this.title}`,
                viewColumn: ViewColumn.One,
            };
        }
    }

    protected getWebviewContent(): string {
        const webview = this.webview!;
        const styles: string = markdownEngine.getStyles(webview);
        const head: string = this.title ? markdownEngine.render(`# ${this.title}`) : "";
        const body: string = markdownEngine.render(this.content, {
            lang: "",
            host: this.getHost(),
        });
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';"/>
                ${styles}
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${head}
                ${body}
            </body>
            </html>
        `;
    }

    private getHost(): string {
        return getLeetCodeEndpoint() === Endpoint.LeetCodeCN
            ? "https://leetcode.cn/"
            : "https://leetcode.com/";
    }
}

export const leetCodeSolutionProvider: LeetCodeSolutionProvider = new LeetCodeSolutionProvider();
