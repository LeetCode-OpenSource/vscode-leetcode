// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { commands, ViewColumn } from "vscode";
import type { IQuestionDetail } from "../api/question";
import { getLeetCodeEndpoint } from "../commands/plugin";
import { Endpoint, IProblem } from "../shared";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";

class LeetCodePreviewProvider extends LeetCodeWebview {
    protected readonly viewType: string = "leetcode.preview";
    private node: IProblem;
    private detail: IQuestionDetail;
    private sideMode: boolean = false;
    private useTranslation: boolean = true;

    public isSideMode(): boolean {
        return this.sideMode;
    }

    public show(detail: IQuestionDetail, node: IProblem, isSideMode: boolean = false, useTranslation: boolean = true): void {
        this.detail = detail;
        this.node = node;
        this.sideMode = isSideMode;
        this.useTranslation = useTranslation;
        this.showWebviewInternal();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        if (!this.sideMode) {
            return {
                title: `${this.node.name}: Preview`,
                viewColumn: ViewColumn.One,
            };
        } else {
            return {
                title: "Description",
                viewColumn: ViewColumn.Two,
                preserveFocus: true,
            };
        }
    }

    protected getWebviewContent(): string {
        const button: { element: string; script: string; style: string } = {
            element: `<button id="solve">Code Now</button>`,
            script: `const button = document.getElementById('solve');
                    button.onclick = () => vscode.postMessage({
                        command: 'ShowProblem',
                    });`,
            style: `<style>
                #solve {
                    position: fixed;
                    bottom: 1rem;
                    right: 1rem;
                    border: 0;
                    margin: 1rem 0;
                    padding: 0.2rem 1rem;
                    color: white;
                    background-color: var(--vscode-button-background);
                }
                #solve:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                #solve:active {
                    border: 0;
                }
                </style>`,
        };
        const title: string = this.useTranslation
            ? (this.detail.translatedTitle || this.detail.title)
            : this.detail.title;
        const url: string = this.getProblemUrl();
        const body: string = this.useTranslation
            ? (this.detail.translatedContent || this.detail.content)
            : this.detail.content;

        const head: string = markdownEngine.render(`# [${title}](${url})`);
        const info: string = markdownEngine.render(
            [
                `| Difficulty |`,
                `| :--------: |`,
                `| ${this.detail.difficulty} |`,
            ].join("\n"),
        );
        const tagItems: string[] = this.detail.topicTags.length > 0
            ? this.detail.topicTags.map((tag) => {
                const label: string = this.useTranslation ? (tag.translatedName || tag.name) : tag.name;
                return `[\`${label}\`](${this.getTagLink(tag.slug)})`;
            })
            : this.node.tags.map((tag: string) => `[\`${tag}\`](${this.getTagLink(tag)})`);
        const tags: string = tagItems.length > 0
            ? [
                `<details>`,
                `<summary><strong>Tags</strong></summary>`,
                markdownEngine.render(tagItems.join(" | ")),
                `</details>`,
            ].join("\n")
            : "";
        const companies: string = this.node.companies.length > 0
            ? [
                `<details>`,
                `<summary><strong>Companies</strong></summary>`,
                markdownEngine.render(this.node.companies.map((company: string) => `\`${company}\``).join(" | ")),
                `</details>`,
            ].join("\n")
            : "";
        const links: string = markdownEngine.render(`[Submissions](${this.getSubmissionsLink(url)}) | [Solution](${this.getSolutionsLink(url)})`);
        const webview = this.webview!;
        const nonce: string = this.getNonce();
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"/>
                ${markdownEngine.getStyles(webview)}
                ${!this.sideMode ? button.style : ""}
                <style>
                    code { white-space: pre-wrap; }
                </style>
            </head>
            <body>
                ${head}
                ${info}
                ${tags}
                ${companies}
                ${body}
                <hr />
                ${links}
                ${!this.sideMode ? button.element : ""}
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    ${!this.sideMode ? button.script : ""}
                </script>
            </body>
            </html>
        `;
    }

    protected onDidDisposeWebview(): void {
        super.onDidDisposeWebview();
        this.sideMode = false;
    }

    protected async onDidReceiveMessage(message: IWebViewMessage): Promise<void> {
        switch (message.command) {
            case "ShowProblem": {
                await commands.executeCommand("leetcode.showProblem", this.node);
                break;
            }
        }
    }

    private getProblemUrl(): string {
        const base: string = getLeetCodeEndpoint() === Endpoint.LeetCodeCN
            ? "https://leetcode.cn"
            : "https://leetcode.com";
        return `${base}/problems/${this.detail.titleSlug}/description/`;
    }

    private getTagLink(tag: string): string {
        const endPoint: string = getLeetCodeEndpoint();
        if (endPoint === Endpoint.LeetCodeCN) {
            return `https://leetcode.cn/tag/${tag}?source=vscode`;
        } else if (endPoint === Endpoint.LeetCode) {
            return `https://leetcode.com/tag/${tag}?source=vscode`;
        }

        return "https://leetcode.com?source=vscode";
    }

    private getSolutionsLink(url: string): string {
        return url.replace("/description/", "/solutions/") + "?source=vscode";
    }

    private getSubmissionsLink(url: string): string {
        return url.replace("/description/", "/submissions/") + "?source=vscode";
    }
}

interface IWebViewMessage {
    command: string;
}

export const leetCodePreviewProvider: LeetCodePreviewProvider = new LeetCodePreviewProvider();
