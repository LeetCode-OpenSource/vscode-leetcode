// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IQuickItemEx } from "../shared";
import { Endpoint, SortingStrategy } from "../shared";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { deleteCache } from "./cache";
import { Language, getCurrentLanguage, t } from "../i18n";

export async function switchEndpoint(): Promise<void> {
    const isCnEnabled: boolean = getLeetCodeEndpoint() === Endpoint.LeetCodeCN;
    const picks: Array<IQuickItemEx<string>> = [];
    picks.push(
        {
            label: `${isCnEnabled ? "" : "$(check) "}LeetCode`,
            description: "leetcode.com",
            detail: t("enable_leetcode_us"),
            value: Endpoint.LeetCode,
        },
        {
            label: `${isCnEnabled ? "$(check) " : ""}力扣`,
            description: "leetcode.cn",
            detail: t("enable_leetcode_cn"),
            value: Endpoint.LeetCodeCN,
        },
    );
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
    if (!choice || choice.value === getLeetCodeEndpoint()) {
        return;
    }
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    try {
        const endpoint: string = choice.value;
        await leetCodeExecutor.switchEndpoint(endpoint);
        await leetCodeConfig.update("endpoint", endpoint, true /* UserSetting */);
        vscode.window.showInformationMessage(t("switched_endpoint", endpoint));
    } catch (error) {
        await promptForOpenOutputChannel(t("failed_to_switch_endpoint"), DialogType.error);
    }

    try {
        await vscode.commands.executeCommand("leetcode.signout");
        await deleteCache();
        await promptForSignIn();
    } catch (error) {
        await promptForOpenOutputChannel(t("failed_to_sign_in_after_switch"), DialogType.error);
    }
}

export function getLeetCodeEndpoint(): string {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    return leetCodeConfig.get<string>("endpoint", Endpoint.LeetCode);
}

const SORT_ORDER: SortingStrategy[] = [
    SortingStrategy.None,
    SortingStrategy.AcceptanceRateAsc,
    SortingStrategy.AcceptanceRateDesc,
];

export async function switchSortingStrategy(): Promise<void> {
    const currentStrategy: SortingStrategy = getSortingStrategy();
    const picks: Array<IQuickItemEx<string>> = [];
    picks.push(
        ...SORT_ORDER.map((s: SortingStrategy) => {
            return {
                label: `${currentStrategy === s ? "$(check)" : "    "} ${s}`,
                value: s,
            };
        }),
    );

    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks);
    if (!choice || choice.value === currentStrategy) {
        return;
    }

    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    await leetCodeConfig.update("problems.sortStrategy", choice.value, true);
    await leetCodeTreeDataProvider.refresh();
}

export function getSortingStrategy(): SortingStrategy {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    return leetCodeConfig.get<SortingStrategy>("problems.sortStrategy", SortingStrategy.None);
}

export async function toggleLanguage(): Promise<void> {
    const current: Language = getCurrentLanguage();
    const picks: Array<IQuickItemEx<string>> = [
        {
            label: `${current === Language.English ? "$(check) " : ""}${t("language_english")}`,
            value: "en",
        },
        {
            label: `${current === Language.Chinese ? "$(check) " : ""}${t("language_chinese")}`,
            value: "zh-CN",
        },
        {
            label: `${current !== Language.English && current !== Language.Chinese ? "$(check) " : ""}${t("language_auto")}`,
            value: "auto",
        },
    ];
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(picks, {
        placeHolder: t("select_ui_language"),
    });
    if (!choice) {
        return;
    }
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    await leetCodeConfig.update("language", choice.value, true /* UserSetting */);
    vscode.window.showInformationMessage(t("switched_language", choice.value === "zh-CN" ? t("language_chinese") : choice.value === "en" ? t("language_english") : t("language_auto")));
    leetCodeTreeDataProvider.refresh();
}
