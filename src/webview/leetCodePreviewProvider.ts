// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { commands, Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IProblem } from "../shared";
import { markdownEngine } from "./markdownEngine";

class LeetCodePreviewProvider implements Disposable {

    private context: ExtensionContext;
    private node: IProblem;
    private panel: WebviewPanel | undefined;

    public initialize(context: ExtensionContext): void {
        this.context = context;
    }

    public async show(node: IProblem): Promise<void> {
        // Fetch problem first before creating webview panel
        const descString: string = await leetCodeExecutor.getDescription(node);

        this.node = node;
        if (!this.panel) {
            this.panel = window.createWebviewPanel("leetcode.preview", "Preview Problem", ViewColumn.One, {
                enableScripts: true,
                enableCommandUris: true,
                enableFindWidget: true,
                retainContextWhenHidden: true,
                localResourceRoots: markdownEngine.localResourceRoots,
            });

            this.panel.webview.onDidReceiveMessage(async (message: IWebViewMessage) => {
                switch (message.command) {
                    case "ShowProblem": {
                        await commands.executeCommand("leetcode.showProblem", this.node);
                        break;
                    }
                }
            }, this, this.context.subscriptions);

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);
        }

        const description: IDescription = this.parseDescription(descString, node);
        this.panel.webview.html = this.getWebViewContent(description);
        this.panel.title = `${node.name}: Preview`;
        this.panel.reveal(ViewColumn.One);
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private parseDescription(descString: string, problem: IProblem): IDescription {
        const [
            /* title */, ,
            url, ,
            /* tags */, ,
            /* langs */, ,
            category,
            difficulty,
            likes,
            dislikes,
            /* accepted */,
            /* submissions */,
            /* testcase */, ,
            ...body
        ] = descString.split("\n");
        return {
            title: problem.name,
            url,
            tags: problem.tags,
            companies: problem.companies,
            category: category.slice(2),
            difficulty: difficulty.slice(2),
            likes: likes.split(": ")[1].trim(),
            dislikes: dislikes.split(": ")[1].trim(),
            body: body.join("\n").replace(/<pre>\s*([^]+?)\s*<\/pre>/g, "<pre><code>$1</code></pre>"),
        };
    }

    private getWebViewContent(desc: IDescription): string {
        const mdStyles: string = markdownEngine.getStyles();
        const buttonStyle: string = `
            <style>
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
            </style>
        `;
        const { title, url, category, difficulty, likes, dislikes, body } = desc;
        const head: string = markdownEngine.render(`# [${title}](${url})`);
        const info: string = markdownEngine.render([
            `| Category | Difficulty | Likes | Dislikes |`,
            `| :------: | :--------: | :---: | :------: |`,
            `| ${category} | ${difficulty} | ${likes} | ${dislikes} |`,
        ].join("\n"));
        const tags: string = [
            `<details>`,
            `<summary><strong>Tags</strong></summary>`,
            markdownEngine.render(
                desc.tags
                    .map((t: string) => `[\`${t}\`](https://leetcode.com/tag/${t})`)
                    .join(" | "),
            ),
            `</details>`,
        ].join("\n");
        const companies: string = [
            `<details>`,
            `<summary><strong>Companies</strong></summary>`,
            markdownEngine.render(
                desc.companies
                    .map((c: string) => `\`${c}\``)
                    .join(" | "),
            ),
            `</details>`,
        ].join("\n");
        return `
            <!DOCTYPE html>
            <html>
            <head>
                ${mdStyles}
                ${buttonStyle}
            </head>
            <body>
                ${head}
                ${info}
                ${tags}
                ${companies}
                ${body}
                <button id="solve">Code Now</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    const button = document.getElementById('solve');
                    button.onclick = () => vscode.postMessage({
                        command: 'ShowProblem',
                    });
                </script>
            </body>
            </html>
        `;
    }

}

interface IDescription {
    title: string;
    url: string;
    tags: string[];
    companies: string[];
    category: string;
    difficulty: string;
    likes: string;
    dislikes: string;
    body: string;
}

interface IWebViewMessage {
    command: string;
}

export const leetCodePreviewProvider: LeetCodePreviewProvider = new LeetCodePreviewProvider();
