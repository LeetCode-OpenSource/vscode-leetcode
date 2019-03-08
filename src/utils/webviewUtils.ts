import { leetCodeExecutor } from "../leetCodeExecutor";
import { IProblem } from "../shared";

export async function renderHTML(node: IProblem): Promise<string> {
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
                        })
                    }
                }())
            </script>
        </body>
    </html>
    `;
    return htmlTemplate;
}
