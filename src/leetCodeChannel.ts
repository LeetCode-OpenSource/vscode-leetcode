"use strict";

import * as vscode from "vscode";

export interface ILeetCodeChannel {
    appendLine(message: any, title?: string): void;
    append(message: any): void;
    show(): void;
    dispose(): void;
}

class LeetCodeChannel implements ILeetCodeChannel {
    private readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel("LeetCode");

    public appendLine(message: any, title?: string): void {
        if (title) {
            const simplifiedTime = (new Date()).toISOString().replace(/z|t/gi, " ").trim(); // YYYY-MM-DD HH:mm:ss.sss
            const hightlightingTitle = `[${title} ${simplifiedTime}]`;
            this.channel.appendLine(hightlightingTitle);
        }
        this.channel.appendLine(message);
    }

    public append(message: any): void {
        this.channel.append(message);
    }

    public show(): void {
        this.channel.show();
    }

    public dispose(): void {
        this.channel.dispose();
    }
}

export const leetcodeChannel: ILeetCodeChannel = new LeetCodeChannel();
