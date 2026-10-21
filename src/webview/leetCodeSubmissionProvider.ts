// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ViewColumn } from "vscode";
import type { ISubmissionResult } from "../api/submission";
import { openKeybindingsEditor, promptHintMessage } from "../utils/uiUtils";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";

class LeetCodeSubmissionProvider extends LeetCodeWebview {

    protected readonly viewType: string = "leetcode.submission";
    private result: ISubmissionResult;

    public show(result: ISubmissionResult): void {
        this.result = result;
        this.showWebviewInternal();
        this.showKeybindingsHint();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        return {
            title: "Submission",
            viewColumn: ViewColumn.Two,
        };
    }

    protected getWebviewContent(): string {
        const status: string = this.result.statusMessage || this.result.state;
        const lines: string[] = [`## ${status}`];

        if (this.result.runtime || this.result.memory || this.result.totalCorrect !== undefined) {
            const details: string[] = [];
            if (this.result.runtime) {
                details.push(`* Runtime: ${this.result.runtime}`);
            }
            if (this.result.memory) {
                details.push(`* Memory: ${this.result.memory}`);
            }
            if (this.result.totalCorrect !== undefined) {
                const total: string = this.result.totalTestcases !== undefined
                    ? ` / ${this.result.totalTestcases}`
                    : "";
                details.push(`* Passed: ${this.result.totalCorrect}${total}`);
            }
            lines.push("", ...details);
        }

        if (this.result.compileError) {
            lines.push("", "### Compile Error", "```text", this.result.compileError, "```");
        }
        if (this.result.runtimeError) {
            lines.push("", "### Runtime Error", "```text", this.result.runtimeError, "```");
        }
        if (this.result.lastTestcase) {
            lines.push("", "### Last Testcase", "```text", this.result.lastTestcase, "```");
        }
        if (this.result.codeOutput) {
            lines.push("", "### Output", "```text", this.result.codeOutput, "```");
        }
        if (this.result.expectedOutput) {
            lines.push("", "### Expected", "```text", this.result.expectedOutput, "```");
        }

        const body: string = markdownEngine.render(lines.join("\n"));
        const webview = this.webview!;
        const styles: string = markdownEngine.getStyles(webview);
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';"/>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${styles}
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${body}
            </body>
            </html>
        `;
    }

    private async showKeybindingsHint(): Promise<void> {
        await promptHintMessage(
            "hint.commandShortcut",
            'You can customize shortcut key bindings in File > Preferences > Keyboard Shortcuts with query "leetcode".',
            "Open Keybindings",
            (): Promise<any> => openKeybindingsEditor("leetcode solution"),
        );
    }
}

export const leetCodeSubmissionProvider: LeetCodeSubmissionProvider = new LeetCodeSubmissionProvider();
