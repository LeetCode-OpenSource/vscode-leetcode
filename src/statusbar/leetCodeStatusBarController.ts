// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ConfigurationChangeEvent, Disposable, workspace, WorkspaceConfiguration } from "vscode";
import { UserStatus } from "../shared";
import { LeetCodeStatusBarItem } from "./LeetCodeStatusBarItem";

class LeetCodeStatusBarController implements Disposable {
    private statusBar: LeetCodeStatusBarItem;
    private configurationChangeListener: Disposable;

    constructor() {
        this.statusBar = new LeetCodeStatusBarItem();
        this.setStatusBarVisibility();

        this.configurationChangeListener = workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration("leetcode.enableStatusBar")) {
                this.setStatusBarVisibility();
            }
        }, this);
    }

    public updateStatusBar(status: UserStatus, user?: string): void {
        this.statusBar.updateStatusBar(status, user);
    }

    public dispose(): void {
        this.statusBar.dispose();
        this.configurationChangeListener.dispose();
    }

    private setStatusBarVisibility(): void {
        if (this.isStatusBarEnabled()) {
            this.statusBar.show();
        } else {
            this.statusBar.hide();
        }
    }

    private isStatusBarEnabled(): boolean {
        const configuration: WorkspaceConfiguration = workspace.getConfiguration();
        return configuration.get<boolean>("leetcode.enableStatusBar", true);
    }
}

export const leetCodeStatusBarController: LeetCodeStatusBarController = new LeetCodeStatusBarController();
