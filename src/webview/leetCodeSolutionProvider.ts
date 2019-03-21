// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { IProblem } from "../shared";
import { MarkdownEngine } from "./MarkdownEngine";

class LeetCodeSolutionProvider implements Disposable {

    private context: ExtensionContext;
    private panel: WebviewPanel | undefined;
    private mdEngine: MarkdownEngine;
    private solution: Solution;

    public initialize(context: ExtensionContext): void {
        this.context = context;
        this.mdEngine = new MarkdownEngine();
    }

    public async show(solutionString: string, problem: IProblem): Promise<void> {
        if (!this.panel) {
            this.panel = window.createWebviewPanel("leetCode.solution", "Top Voted Solution", ViewColumn.Active, {
                retainContextWhenHidden: true,
                enableFindWidget: true,
                localResourceRoots: this.mdEngine.localResourceRoots,
            });

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);
        }

        this.solution = this.parseSolution(solutionString);
        this.panel.title = problem.name;
        this.panel.webview.html = this.getWebViewContent(this.solution);
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

    private getWebViewContent(solution: Solution): string {
        const styles: string = this.mdEngine.getStylesHTML();
        const { title, url, lang, author, votes } = solution;
        const head: string = this.mdEngine.render(`# [${title}](${url})`);
        const auth: string = `[${author}](https://leetcode.com/${author}/)`;
        const info: string = this.mdEngine.render([
            `| Language |  Author  |  Votes   |`,
            `| :------: | :------: | :------: |`,
            `| ${lang}  | ${auth}  | ${votes} |`,
        ].join("\n"));
        const body: string = this.mdEngine.render(solution.body, {
            lang: this.solution.lang,
            host: "https://discuss.leetcode.com/",
        });
        return `
            <!DOCTYPE html>
            <html>
            <head>
                ${styles}
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${head}
                ${info}
                ${body}
            </body>
            </html>
        `;
    }
}

// tslint:disable-next-line:max-classes-per-file
class Solution {
    public title: string = "";
    public url: string = "";
    public lang: string = "";
    public author: string = "";
    public votes: string = "";
    public body: string = ""; // Markdown supported
}

export const leetCodeSolutionProvider: LeetCodeSolutionProvider = new LeetCodeSolutionProvider();
