// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IQuickItemEx } from "../shared";
import { Endpoint } from "../shared";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { deleteCache } from "./cache";

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
        await deleteCache();
        await promptForSignIn();
    } catch (error) {
        await promptForOpenOutputChannel("Failed to sign in. Please open the output channel for details.", DialogType.error);
    }
}

export async function initializeEndpoint(): Promise<void> {
    const isCnEnabledInExtension: boolean = isLeetCodeCnEnabled();
    const isCnEnabledInCli: boolean = await isLeetCodeCnEnabledInCli();
    await leetCodeExecutor.toggleLeetCodeCn(isCnEnabledInExtension);
    if (isCnEnabledInCli !== isCnEnabledInExtension) {
        await deleteCache();
    }
}

export function isLeetCodeCnEnabled(): boolean {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    const endpoint: string | undefined = leetCodeConfig.get<string>("endpoint");
    if (endpoint && endpoint === Endpoint.LeetCodeCN) {
        return true;
    }
    return false;
}

async function isLeetCodeCnEnabledInCli(): Promise<boolean> {
    const pluginsStatusFile: string = path.join(os.homedir(), ".lc", "plugins.json");
    if (!await fse.pathExists(pluginsStatusFile)) {
        return false;
    }
    const pluginsObj: {} = await fse.readJson(pluginsStatusFile);
    return pluginsObj["leetcode.cn"];
}
