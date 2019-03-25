// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { leetCodeChannel } from "../leetCodeChannel";
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

        const result: Result = this.parseResult(resultString);
        this.panel.webview.html = this.getWebViewContent(result);
        this.panel.reveal(ViewColumn.Two);
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private parseResult(raw: string): Result {
        try {
            switch (raw[2]) {
                case "√": {
                    const result: AcceptResult = new AcceptResult();
                    [result.status, raw] = raw.split(/  . (.+)([^]+)/).slice(1);
                    [result.passed, raw] = raw.split(/\n  . (.+)([^]+)/).slice(1);
                    [result.runtime, raw] = raw.split(/\n  . (.+)([^]+)/).slice(1);
                    [result.memory] = raw.split(/\n  . (.+)/).slice(1);
                    return result;
                }
                case "×": {
                    const result: FailedResult = new FailedResult();
                    [result.status, raw] = raw.split(/  . (.+)([^]+)/).slice(1);
                    [result.passed, raw] = raw.split(/\n  . (.+)([^]+)/).slice(1);
                    [result.testcase, raw] = raw.split(/\n  . testcase: '(.+)'([^]+)/).slice(1);
                    [result.answer, raw] = raw.split(/\n  . answer: (.+)([^]+)/).slice(1);
                    [result.expected, raw] = raw.split(/\n  . expected_answer: (.+)([^]+)/).slice(1);
                    [result.stdout] = raw.split(/\n  . stdout: ([^]+?)\n$/).slice(1);
                    result.testcase = result.testcase.replace("\\n", "\n");
                    return result;
                }
                default: {
                    throw new TypeError(raw);
                }
            }
        } catch (error) {
            leetCodeChannel.appendLine(`Result parsing failed: ${error.message}`);
            throw error;
        }
    }

    private getWebViewContent(result: Result): string {
        const styles: string = markdownEngine.getStylesHTML();
        let body: string;
        if (result instanceof AcceptResult) {
            const accpet: AcceptResult = result as AcceptResult;
            body = markdownEngine.render([
                `## ${result.status}`,
                ``,
                `* ${result.passed}`,
                `* ${accpet.runtime}`,
                `* ${accpet.memory}`,
            ].join("\n"));
        } else {
            const failed: FailedResult = result as FailedResult;
            body = markdownEngine.render([
                `## ${result.status}`,
                `* ${result.passed}`,
                ``,
                `### Testcase`, // TODO: add command to copy raw testcase
                `\`\`\`\n${failed.testcase}\n\`\`\``,
                `### Answer`,
                `\`\`\`\n${failed.answer}\n\`\`\``,
                `### Expected`,
                `\`\`\`\n${failed.expected}\n\`\`\``,
                `### Stdout`,
                `\`\`\`\n${failed.stdout}\n\`\`\``,
            ].join("\n"));
        }
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

// tslint:disable-next-line:max-classes-per-file
abstract class Result {
    public status: string;
    public passed: string;
}

// tslint:disable-next-line:max-classes-per-file
class AcceptResult extends Result {
    public runtime: string;
    public memory: string;
}

// tslint:disable-next-line:max-classes-per-file
class FailedResult extends Result {
    public testcase: string;
    public answer: string;
    public expected: string;
    public stdout: string;
}

export const leetCodeResultProvider: LeetCodeResultProvider = new LeetCodeResultProvider();
