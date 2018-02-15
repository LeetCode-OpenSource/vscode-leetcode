"use strict";

import * as opn from "opn";
import * as vscode from "vscode";
import { executeCommand } from "./cpUtils";
import { DialogOptions } from "./uiUtils";

export async function isNodeInstalled(channel: vscode.OutputChannel): Promise<boolean> {
    try {
        await executeCommand(channel, "node", ["-v"]);
        return true;
    } catch (error) {
        const choice = await vscode.window.showErrorMessage(
            "LeetCode extension need Node.js installed in environment path",
            DialogOptions.open,
        );
        if (choice === DialogOptions.open) {
            opn("https://nodejs.org");
        }
        return false;
    }
}
