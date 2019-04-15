// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ConfigurationChangeEvent, Disposable, ExtensionContext, ViewColumn, WebviewPanel, window, workspace } from "vscode";
import { markdownEngine } from "./markdownEngine";

export abstract class LeetCodeWebview implements Disposable {

    protected panel: WebviewPanel | undefined;
    private context: ExtensionContext;
    private configListener: Disposable | undefined;

    public initialize(context: ExtensionContext): void {
        this.context = context;
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    protected showWebviewInternal(): this is { panel: WebviewPanel } {
        const { viewType, title, viewColumn } = this.getWebviewOption();
        if (!this.panel) {
            this.panel = window.createWebviewPanel(viewType, title, viewColumn || ViewColumn.Active, {
                enableScripts: true,
                enableCommandUris: true,
                enableFindWidget: true,
                retainContextWhenHidden: true,
                localResourceRoots: markdownEngine.localResourceRoots,
            });
            this.panel.onDidDispose(this.onDidDisposeWebview, this, this.context.subscriptions);
            this.panel.webview.onDidReceiveMessage(this.onDidReceiveMessage, this, this.context.subscriptions);
            this.configListener = workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this);
        }
        this.panel.webview.html = this.getWebviewContent();
        return true;
    }

    protected onDidDisposeWebview(): void {
        this.panel = undefined;
        if (this.configListener) {
            this.configListener.dispose();
            this.configListener = undefined;
        }
    }

    protected async onDidChangeConfiguration(event: ConfigurationChangeEvent): Promise<void> {
        if (this.panel && event.affectsConfiguration("markdown")) {
            this.panel.webview.html = this.getWebviewContent();
        }
    }

    protected async onDidReceiveMessage(/* message */_: any): Promise<void> { /* no special rule */ }

    protected abstract getWebviewOption(): ILeetCodeWebviewOption;

    protected abstract getWebviewContent(): string;
}

export interface ILeetCodeWebviewOption {
    viewType: string;
    title: string;
    viewColumn?: ViewColumn;
}
