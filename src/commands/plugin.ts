"use strict";

import * as vscode from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IQuickItemEx } from "../shared";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";

export async function toogleLeetCodeCn(): Promise<void> {
    const isCnEnbaled: boolean = isLeetCodeCnEnabled();
    const picks: Array<IQuickItemEx<string>> = [];
    picks.push(
        {
            label: `${isCnEnbaled ? "$(check) " : ""}On`,
            description: "",
            detail: "Enable leetcode-cn.",
            value: "on",
        },
        {
            label: `${isCnEnbaled ? "" : "$(check) "}Off`,
            description: "",
            detail: "Disable leetcode-cn.",
            value: "off",
        },
    );
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
    if (!choice) {
        return;
    }
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    try {
        if (choice.value === "on") {
            await leetCodeExecutor.toggleLeetCodeCn(true);
            await leetCodeConfig.update("endpoint", "leetcode.cn", true /* UserSetting */);
            vscode.window.showInformationMessage("Switched the endpoint to leetcode-cn.");
        } else {
            await leetCodeExecutor.toggleLeetCodeCn(false);
            await leetCodeConfig.update("endpoint", "leetcode", true /* UserSetting */);
            vscode.window.showInformationMessage("Switched the endpoint to leetcode.");
        }
    } catch (error) {
        await promptForOpenOutputChannel("Failed to switch endpoint. Please open the output channel for details.", DialogType.error);
    }

    try {
        await vscode.commands.executeCommand("leetcode.signout");
        await promptForSignIn();
    } catch (error) {
        await promptForOpenOutputChannel("Failed to sign in. Please open the output channel for details.", DialogType.error);
    }
}

export async function initializeEndpoint(): Promise<void> {
    await leetCodeExecutor.toggleLeetCodeCn(isLeetCodeCnEnabled());
}

export function isLeetCodeCnEnabled(): boolean {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    const endpoint: string | undefined = leetCodeConfig.get<string>("endpoint");
    if (endpoint && endpoint === "leetcode.cn") {
        return true;
    }
    return false;
}
