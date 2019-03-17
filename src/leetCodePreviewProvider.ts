import { commands, Disposable, ExtensionContext, ViewColumn, WebviewPanel, window } from "vscode";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { IProblem } from "./shared";
class LeetCodePreviewProvider implements Disposable {

    private context: ExtensionContext;
    private panel: WebviewPanel | undefined;

    public initialize(context: ExtensionContext): void {
        this.context = context;
    }

    public async preview(node: IProblem): Promise<void> {
        if (!this.panel) {
            this.panel = window.createWebviewPanel("leetcode.preview", "Preview Problem", ViewColumn.Active, {
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
                case "ShowProblem":
                    await commands.executeCommand("leetcode.showProblem", node);
                    this.dispose();
                    return;
            }
        });
        this.panel.webview.html = await this.provideHtmlContent(node);
        this.panel.title = node.name;
        this.panel.reveal();
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    public async provideHtmlContent(node: IProblem): Promise<string> {
        return await this.renderHTML(node);
    }

    private async renderHTML(node: IProblem): Promise<string> {
        const description: string = await leetCodeExecutor.getDescription(node);
        const descriptionHTML: string = description.replace(/\n/g, "<br>");
        const htmlTemplate: string = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview Problem</title>
            </head>
            <style>
                #solve {
                    position: fixed;
                    bottom: 1rem;
                    right: 1rem;
                    border: 0;
                    margin: 1rem 0;
                    padding: 0.2rem 1rem;
                    color: white;
                    background-color: var(--vscode-button-background);
                }
                #solve:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                #solve:active {
                    border: 0;
                }
            </style>
            <body>
                <div >
                    ${ descriptionHTML}
                </div>
                <button id="solve">Code Now</button>
                <script>
                    (function() {
                        const vscode = acquireVsCodeApi();
                        let button = document.getElementById('solve');
                        button.onclick = solveHandler;
                        function solveHandler() {
                            vscode.postMessage({
                                command: 'ShowProblem',
                            });
                        }
                    }());
                </script>
            </body>
        </html>
        `;
        return htmlTemplate;
    }

}
export interface IWebViewMessage {
    command: string;
}

export const leetCodePreviewProvider: LeetCodePreviewProvider = new LeetCodePreviewProvider();
