// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ConfigurationChangeEvent, Disposable, ViewColumn, WebviewPanel, window, workspace } from "vscode";
import { markdownEngine } from "./markdownEngine";

export abstract class LeetCodeWebview implements Disposable {

    protected panel: WebviewPanel | undefined;
    private listeners: Disposable[] = [];

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    protected showWebviewInternal(): void {
        const { viewType, title, viewColumn, preserveFocus } = this.getWebviewOption();
        if (!this.panel) {
            this.panel = window.createWebviewPanel(viewType, title, { viewColumn, preserveFocus }, {
                enableScripts: true,
                enableCommandUris: true,
                enableFindWidget: true,
                retainContextWhenHidden: true,
                localResourceRoots: markdownEngine.localResourceRoots,
            });
            this.panel.onDidDispose(this.onDidDisposeWebview, this, this.listeners);
            this.panel.webview.onDidReceiveMessage(this.onDidReceiveMessage, this, this.listeners);
            workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this, this.listeners);
        } else {
            this.panel.title = title;
            this.panel.reveal(viewColumn, preserveFocus);
        }
        this.panel.webview.html = this.getWebviewContent();
    }

    protected onDidDisposeWebview(): void {
        this.panel = undefined;
        for (const listener of this.listeners) {
            listener.dispose();
        }
        this.listeners = [];
    }

    protected async onDidChangeConfiguration(event: ConfigurationChangeEvent): Promise<void> {
        if (this.panel && event.affectsConfiguration("markdown")) {
            this.panel.webview.html = this.getWebviewContent();
        }
    }

    protected async onDidReceiveMessage(_message: any): Promise<void> { /* no special rule */ }

    protected abstract getWebviewOption(): ILeetCodeWebviewOption;

    protected abstract getWebviewContent(): string;
}

export interface ILeetCodeWebviewOption {
    viewType: string;
    title: string;
    viewColumn: ViewColumn;
    preserveFocus?: boolean;
}
