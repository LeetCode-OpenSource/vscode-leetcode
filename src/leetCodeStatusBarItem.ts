"use strict";

import * as vscode from "vscode";
import { leetCodeManager } from "./leetCodeManager";
import { UserStatus } from "./shared";

export interface ILeetCodeStatusBarItem {
    updateStatusBar(status: UserStatus, user?: string): void;
    dispose(): void;
}

class LeetCodeStatusBarItem implements ILeetCodeStatusBarItem {
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem();
        this.statusBarItem.command = "leetcode.selectSessions";
        leetCodeManager.on("statusChanged", () => {
            leetCodeStatusBarItem.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
        });
    }

    public updateStatusBar(status: UserStatus, user?: string): void {
        switch (status) {
            case UserStatus.SignedIn:
                this.statusBarItem.text = `LeetCode: ${user}`;
                this.statusBarItem.show();
                break;
            case UserStatus.SignedOut:
            default:
                this.statusBarItem.hide();
                break;
        }
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}

export const leetCodeStatusBarItem: ILeetCodeStatusBarItem = new LeetCodeStatusBarItem();
