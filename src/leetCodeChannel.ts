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

    public appendLine(message: string): void {
        this.channel.appendLine(message);
    }

    public append(message: string): void {
        this.channel.append(message);
    }

    public show(): void {
        this.channel.show();
    }

    public dispose(): void {
        this.channel.dispose();
    }
}

export const leetCodeChannel: ILeetCodeChannel = new LeetCodeChannel();
