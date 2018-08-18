"use strict";

import * as vscode from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IQuickItemEx } from "../shared";
import { Endpoint } from "../shared";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";

export async function toogleLeetCodeCn(): Promise<void> {
    const isCnEnbaled: boolean = isLeetCodeCnEnabled();
    const picks: Array<IQuickItemEx<string>> = [];
    picks.push(
        {
            label: `${isCnEnbaled ? "$(check) " : ""}On`,
            description: "",
            detail: `Enable ${Endpoint.LeetCodeCN}.`,
            value: "on",
        },
        {
            label: `${isCnEnbaled ? "" : "$(check) "}Off`,
            description: "",
            detail: `Disable ${Endpoint.LeetCodeCN}.`,
            value: "off",
        },
    );
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
    if (!choice) {
        return;
    }
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    try {
        const enabled: boolean = choice.value === "on";
        const endpoint: string = enabled ? Endpoint.LeetCodeCN : Endpoint.LeetCode;
        await leetCodeExecutor.toggleLeetCodeCn(enabled);
        await leetCodeConfig.update("endpoint", endpoint, true /* UserSetting */);
        vscode.window.showInformationMessage(`Switched the endpoint to ${endpoint}`);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to switch endpoint. Please open the output channel for details.", DialogType.error);
    }

    try {
        await vscode.commands.executeCommand("leetcode.signout");
        await vscode.commands.executeCommand("leetcode.deleteCache");
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
    if (endpoint && endpoint === Endpoint.LeetCodeCN) {
        return true;
    }
    return false;
}
