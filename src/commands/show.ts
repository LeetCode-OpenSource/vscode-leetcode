"use strict";

import * as vscode from "vscode";
import { LeetCodeNode } from "../leetCodeExplorer"
import { selectWorkspaceFolder } from "../utils/workspaceUtils";
import { languages, leetCodeBinaryPath } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function showProblem(node?: LeetCodeNode): Promise<void> {
    let id: string;
    if (!node) {
        return;
    } else {
        id = node.id;
    }
    try {
        const language: string | undefined = await vscode.window.showQuickPick(languages, { placeHolder: "Select the language you want to use" });
        if (!language) {
            return;
        }
        const outdir: string = await selectWorkspaceFolder();
        const result: string = await executeCommand("node", [leetCodeBinaryPath, "show", id, "-gx", "-l", language, "-o", outdir]);
        const reg: RegExp = /\* Source Code:\s*(.*)/;
        const match: RegExpMatchArray | null = result.match(reg);
        if (match && match.length >= 2) {
            await vscode.window.showTextDocument(vscode.Uri.file(match[1].trim()));
        } else {
            throw new Error("Failed to fetch the problem information");
        }
    } catch (error) {
        await promptForOpenOutputChannel("Failed to fetch the problem information. Please open the output channel for details", DialogType.error);
    }
}
