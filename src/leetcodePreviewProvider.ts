import { commands, Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { IProblem, IWebViewMessage } from "./shared";
import { renderHTML } from "./utils/webviewUtils";

class LeetCodePreviewProvider implements Disposable {

    private context: ExtensionContext;
    private panel: WebviewPanel | undefined;

    public initialize(context: ExtensionContext): void {
        this.context = context;
    }

    public async preview(node: IProblem): Promise<void> {
        if (!this.panel) {
            const panelType: string = "previewProblem";
            const panelTitle: string = node.name;
            this.panel = window.createWebviewPanel(panelType, panelTitle, ViewColumn.Active, {
                enableScripts: true,
                enableCommandUris: true,
                enableFindWidget: true,
                retainContextWhenHidden: true,
            });
        }

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);


        this.panel.webview.onDidReceiveMessage(async (message: IWebViewMessage) => {
            switch (message.command) {
                case 'ShowProblem':
                    await commands.executeCommand("leetcode.showProblem", node);
                    this.dispose();
                    return;
            }
        });
        this.panel.webview.html = await this.provideHtmlContent(node);
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private async provideHtmlContent(node: IProblem): Promise<string> {
        return await renderHTML(node)
    }
}

export const leetCodePreviewProvider: LeetCodePreviewProvider = new LeetCodePreviewProvider();
