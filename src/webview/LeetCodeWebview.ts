// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ConfigurationChangeEvent, Disposable, ExtensionContext, ViewColumn, WebviewPanel, window, workspace } from "vscode";
import { markdownEngine } from "./markdownEngine";

export abstract class LeetCodeWebview implements Disposable {

    protected panel: WebviewPanel | undefined;
    private context: ExtensionContext;
    private listener: Disposable;

    public initialize(context: ExtensionContext): void {
        this.context = context;
        this.listener = workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration("markdown") && this.panel) {
                this.panel.webview.html = this.getWebviewContent();
            }
        }, this);
    }

    public dispose(): void {
        this.listener.dispose();
        if (this.panel) {
            this.panel.dispose();
        }
    }

    protected showWebviewInternal(): this is { panel: WebviewPanel } {
        if (!this.panel) {
            const option: ILeetCodeWebviewOption = this.getWebviewOption();

            this.panel = window.createWebviewPanel(option.viewType, option.title, ViewColumn.One, {
                enableScripts: true,
                enableCommandUris: true,
                enableFindWidget: true,
                retainContextWhenHidden: true,
                localResourceRoots: markdownEngine.localResourceRoots,
            });

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);

            if (option.onDidReceiveMessage) {
                this.panel.webview.onDidReceiveMessage(option.onDidReceiveMessage, this, this.context.subscriptions);
            }
        }

        this.panel.webview.html = this.getWebviewContent();
        return true;
    }

    protected abstract getWebviewOption(): ILeetCodeWebviewOption;

    protected abstract getWebviewContent(): string;
}

export interface ILeetCodeWebviewOption {
    viewType: string;
    title: string;
    onDidReceiveMessage?: (message: any) => Promise<void>;
}
