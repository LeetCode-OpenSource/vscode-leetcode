"use strict";

import * as vscode from "vscode";

export interface ILeetCodeStatusBarItem {
    updateStatusBar(status: LeetCodeStatus, user?: string): void;
    dispose(): void;
}

class LeetCodeStatusBarItem implements ILeetCodeStatusBarItem {
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem();
        this.statusBarItem.command = "leetcode.selectSessions";
    }

    public updateStatusBar(status: LeetCodeStatus, user?: string): void {
        switch (status) {
            case LeetCodeStatus.SignedIn:
                this.statusBarItem.text = `LeetCode: ${user}`;
                this.statusBarItem.show();
                break;
            case LeetCodeStatus.SignedOut:
            default:
                this.statusBarItem.hide();
                break;
        }
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}

export enum LeetCodeStatus {
    SignedIn = 1,
    SignedOut = 2,
}

export const leetCodeStatusBarItem: ILeetCodeStatusBarItem = new LeetCodeStatusBarItem();
