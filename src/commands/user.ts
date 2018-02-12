"use strict";

import * as vscode from "vscode";
import { leetCodeBinaryPath } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogOptions, DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function getSignedInAccount(): Promise<string | undefined> {
    try {
        const result = await executeCommand("node", [leetCodeBinaryPath, "user"]);
        return result.slice("You are now login as".length).trim();
    } catch (error) {
        const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
            "[LeetCode] Would you like to sign in?",
            DialogOptions.yes,
            DialogOptions.no,
        );
        if (choice === DialogOptions.yes) {
            // sign in
        }
        return undefined;
    }
}

export function signIn(terminal: vscode.Terminal): void {
    terminal.show();
    terminal.sendText(`node ${leetCodeBinaryPath} user -l`);
}

export async function signOut(): Promise<void> {
    try {
        await executeCommand("node", [leetCodeBinaryPath, "user", "-L"]);
        vscode.window.showInformationMessage("Successfully signed out.");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to sign out. Would you like to open output channel for detais?", DialogType.error);
    }
}
