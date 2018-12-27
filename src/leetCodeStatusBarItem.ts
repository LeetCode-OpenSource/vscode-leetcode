// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { UserStatus } from "./shared";

class LeetCodeStatusBarItem implements vscode.Disposable {
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem();
        this.statusBarItem.command = "leetcode.selectSessions";
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

export const leetCodeStatusBarItem: LeetCodeStatusBarItem = new LeetCodeStatusBarItem();
