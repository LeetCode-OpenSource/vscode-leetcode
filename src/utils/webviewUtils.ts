import { leetCodeExecutor } from "../leetCodeExecutor";
import { Command, IProblem } from "../shared";

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
                bottom: 10px;
                right: 10px;
                border: 0;
                margin: 10px 0;
                padding: 2px 14px;
                color: white;
                background-color: rgb(14, 99, 156);
            }
            #solve:hover {
                background-color: rgb(17, 119, 187);
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
                            command: '${Command.ShowProblem}',
                        })
                    }
                }())
            </script>
        </body>
    </html>
    `;
    return htmlTemplate;
}
