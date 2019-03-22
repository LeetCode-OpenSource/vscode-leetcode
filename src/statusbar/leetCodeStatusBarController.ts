// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ConfigurationChangeEvent, Disposable, workspace, WorkspaceConfiguration } from "vscode";
import { leetCodeManager } from "../leetCodeManager";
import { UserStatus } from "../shared";
import { LeetCodeStatusBarItem } from "./leetCodeStatusBarItem";

class LeetCodeStatusBarController implements Disposable {
    private statusBar: LeetCodeStatusBarItem | undefined;
    private configurationChangeListener: Disposable;

    constructor() {
        if (this.isStatusBarEnabled()) {
            this.statusBar = new LeetCodeStatusBarItem();
        }

        this.configurationChangeListener = workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration("leetcode.enableStatusBar")) {
                const isStatusBarEnabled: boolean = this.isStatusBarEnabled();
                if (isStatusBarEnabled && this.statusBar === undefined) {
                    this.statusBar = new LeetCodeStatusBarItem();
                    this.statusBar.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
                } else if (!isStatusBarEnabled && this.statusBar !== undefined) {
                    this.statusBar.dispose();
                    this.statusBar = undefined;
                }
            }
        }, this);
    }

    public updateStatusBar(status: UserStatus, user?: string): void {
        if (this.statusBar) {
            this.statusBar.updateStatusBar(status, user);
        }
    }

    public dispose(): void {
        if (this.statusBar) {
            this.statusBar.dispose();
        }
        this.configurationChangeListener.dispose();
    }

    private isStatusBarEnabled(): boolean {
        const configuration: WorkspaceConfiguration = workspace.getConfiguration();
        return configuration.get<boolean>("leetcode.enableStatusBar", false);
    }
}

export const leetCodeStatusBarController: LeetCodeStatusBarController = new LeetCodeStatusBarController();
