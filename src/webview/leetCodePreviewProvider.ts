// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { commands, ViewColumn } from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IProblem } from "../shared";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";

class LeetCodePreviewProvider extends LeetCodeWebview {

    private node: IProblem;
    private description: IDescription;

    public async show(node: IProblem): Promise<void> {
        this.description = this.parseDescription(await leetCodeExecutor.getDescription(node), node);
        this.node = node;
        this.showWebviewInternal();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        return {
            viewType: "leetcode.preview",
            title: `${this.node.name}: Preview`,
            viewColumn: ViewColumn.One,
        };
    }

    protected getWebviewContent(): string {
        const button: { element: string, script: string, style: string } = {
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
        const { title, url, category, difficulty, likes, dislikes, body } = this.description;
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
                this.description.tags
                    .map((t: string) => `[\`${t}\`](https://leetcode.com/tag/${t})`)
                    .join(" | "),
            ),
            `</details>`,
        ].join("\n");
        const companies: string = [
            `<details>`,
            `<summary><strong>Companies</strong></summary>`,
            markdownEngine.render(
                this.description.companies
                    .map((c: string) => `\`${c}\``)
                    .join(" | "),
            ),
            `</details>`,
        ].join("\n");
        return `
            <!DOCTYPE html>
            <html>
            <head>
                ${markdownEngine.getStyles()}
                ${button.style}
            </head>
            <body>
                ${head}
                ${info}
                ${tags}
                ${companies}
                ${body}
                ${button.element}
                <script>
                    const vscode = acquireVsCodeApi();
                    ${button.script}
                </script>
            </body>
            </html>
        `;
    }

    protected onDidDisposeWebview(): void {
        super.onDidDisposeWebview();
        delete this.node;
        delete this.description;
    }

    protected async onDidReceiveMessage(message: IWebViewMessage): Promise<void> {
        switch (message.command) {
            case "ShowProblem": {
                await commands.executeCommand("leetcode.showProblem", this.node);
                break;
            }
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
