// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as _ from "lodash";
import { Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { markdownEngine } from "./markdownEngine";

class LeetCodeResultProvider implements Disposable {

    private context: ExtensionContext;
    private panel: WebviewPanel | undefined;

    public initialize(context: ExtensionContext): void {
        this.context = context;
    }

    public async show(resultString: string): Promise<void> {
        if (!this.panel) {
            this.panel = window.createWebviewPanel("leetcode.result", "Submission Result", ViewColumn.Two, {
                retainContextWhenHidden: true,
                enableFindWidget: true,
                localResourceRoots: markdownEngine.localResourceRoots,
            });

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);
        }

        const result: IResult = this.parseResult(resultString);
        this.panel.webview.html = this.getWebViewContent(result);
        this.panel.reveal(ViewColumn.Two);
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private parseResult(raw: string): IResult {
        raw = raw.concat("  √ "); // Append a dummy sentinel to the end of raw string
        const regSplit: RegExp = /  [√×✔✘vx] ([^]+?)\n(?=  [√×✔✘vx] )/g;
        const regKeyVal: RegExp = /(.+?): ([^]*)/;
        const result: IResult = { messages: [] };
        let entry: RegExpExecArray | null;
        do {
            entry = regSplit.exec(raw);
            if (!entry) {
                continue;
            }
            const kvMatch: RegExpExecArray | null = regKeyVal.exec(entry[1]);
            if (kvMatch) {
                const key: string = _.startCase(kvMatch[1]);
                let value: string = kvMatch[2];
                if (!result[key]) {
                    result[key] = [];
                }
                if (key === "Testcase") {
                    value = value.slice(1, -1).replace("\\n", "\n");
                }
                result[key].push(value);
            } else {
                result.messages.push(entry[1]);
            }
        } while (entry);
        return result;
    }

    private getWebViewContent(result: IResult): string {
        const styles: string = markdownEngine.getStylesHTML();
        const title: string = `## ${result.messages[0]}`;
        const messages: string[] = result.messages.slice(1).map((m: string) => `* ${m}`);
        const sections: string[] = Object.keys(result).filter((k: string) => k !== "messages").map((key: string) => [
            `### ${key}`,
            "```",
            result[key].join("\n\n"),
            "```",
        ].join("\n"));
        const body: string = markdownEngine.render([
            title,
            ...messages,
            ...sections,
        ].join("\n"));
        return `
            <!DOCTYPE html>
            <html>
            <head>
                ${styles}
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${body}
            </body>
            </html>
        `;
    }
}

interface IResult {
    [key: string]: string[];
    messages: string[];
}

export const leetCodeResultProvider: LeetCodeResultProvider = new LeetCodeResultProvider();
