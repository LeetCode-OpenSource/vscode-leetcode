// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as hljs from "highlight.js";
import * as MarkdownIt from "markdown-it";
import * as path from "path";
import * as vscode from "vscode";
import { Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { leetCodeChannel } from "./leetCodeChannel";
import { IProblem } from "./shared";

class LeetCodeSolutionProvider implements Disposable {

    private context: ExtensionContext;
    private panel: WebviewPanel | undefined;
    private markdown: MarkdownIt;
    private markdownPath: string; // path of vscode built-in markdown extension
    private solution: Solution;

    public initialize(context: ExtensionContext): void {
        this.context = context;
        this.markdown = new MarkdownIt({
            linkify: true,
            typographer: true,
            highlight: this.codeHighlighter.bind(this),
        });
        this.markdownPath = path.join(vscode.env.appRoot, "extensions", "markdown-language-features");

        // Override code_block rule for highlighting in solution language
        // tslint:disable-next-line:typedef
        this.markdown.renderer.rules["code_block"] = (tokens, idx, options, _, self) => {
            const highlight: string = options.highlight(tokens[idx].content, undefined);
            return [
                `<pre><code ${self.renderAttrs(tokens[idx])} >`,
                highlight || this.markdown.utils.escapeHtml(tokens[idx].content),
                "</code></pre>",
            ].join("\n");
        };
    }

    public async show(solutionString: string, problem: IProblem): Promise<void> {
        if (!this.panel) {
            this.panel = window.createWebviewPanel("leetCode", "Top voted solution", ViewColumn.Active, {
                retainContextWhenHidden: true,
                enableFindWidget: true,
                localResourceRoots: [vscode.Uri.file(path.join(this.markdownPath, "media"))],
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

    private codeHighlighter(code: string, lang: string | undefined): string {
        if (!lang) {
            lang = this.solution.lang;
        }
        if (hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, code, true).value;
            } catch (error) { /* do not highlight */ }
        }
        return ""; // use external default escaping
    }

    private getMarkdownStyles(): vscode.Uri[] {
        try {
            const stylePaths: string[] = require(path.join(this.markdownPath, "package.json"))["contributes"]["markdown.previewStyles"];
            return stylePaths.map((p: string) => vscode.Uri.file(path.join(this.markdownPath, p)).with({ scheme: "vscode-resource" }));
        } catch (error) {
            leetCodeChannel.appendLine("[Error] Fail to load built-in markdown style file.");
            return [];
        }
    }

    private getWebViewContent(solution: Solution): string {
        const styles: string = this.getMarkdownStyles()
            .map((style: vscode.Uri) => `<link rel="stylesheet" type="text/css" href="${style.toString()}">`)
            .join("\n");
        const { title, url, lang, author, votes } = solution;
        const head: string = this.markdown.render(`# [${title}](${url})`);
        const auth: string = `[${author}](https://leetcode.com/${author}/)`;
        const info: string = this.markdown.render([
            `| Language |  Author  |  Votes   |`,
            `| :------: | :------: | :------: |`,
            `| ${lang}  | ${auth}  | ${votes} |`,
        ].join("\n"));
        const body: string = this.markdown.render(solution.body);
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
