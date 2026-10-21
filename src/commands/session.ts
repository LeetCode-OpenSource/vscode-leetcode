// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { globalState, IProfileInfo } from "../globalState";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx } from "../shared";
import { DialogOptions, DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";
import { validateCookie } from "../auth/cookie";

export interface ISession {
    active: boolean;
    name: string;
    username: string;
    updatedAt: number;
}

export function getSessionList(): ISession[] {
    const active: string | undefined = globalState.getActiveProfile();
    return globalState.getProfiles().map((profile: IProfileInfo) => ({
        active: profile.name === active,
        name: profile.name,
        username: profile.username,
        updatedAt: profile.updatedAt,
    }));
}

export async function manageSessions(): Promise<void> {
    const choice: IQuickItemEx<ISession | string> | undefined = await vscode.window.showQuickPick(
        parseSessionsToPicks(true),
    );
    if (!choice || choice.description === "Active") {
        return;
    }
    if (choice.value === ":createSession") {
        await createSession();
        return;
    }
    if (choice.value === ":deleteSession") {
        await deleteSession();
        return;
    }

    try {
        await leetCodeManager.switchProfile((choice.value as ISession).name);
        await vscode.commands.executeCommand("leetcode.refreshExplorer");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to switch session. Please open the output channel for details.", DialogType.error);
    }
}

function parseSessionsToPicks(includeOperations: boolean = false): Array<IQuickItemEx<ISession | string>> {
    const picks: Array<IQuickItemEx<ISession | string>> = getSessionList().map((session: ISession) => ({
        label: `${session.active ? "$(check) " : ""}${session.name}`,
        description: session.active ? vscode.l10n.t("Active") : "",
        detail: vscode.l10n.t("User: {0}", session.username),
        value: session,
    }));

    if (includeOperations) {
        picks.push(...parseSessionManagementOperations());
    }
    return picks;
}

function parseSessionManagementOperations(): Array<IQuickItemEx<string>> {
    return [{
        label: "$(plus) Create a session",
        description: "",
        detail: "Click this item to create a session",
        value: ":createSession",
    }, {
        label: "$(trashcan) Delete a session",
        description: "",
        detail: "Click this item to DELETE a session",
        value: ":deleteSession",
    }];
}

async function createSession(): Promise<void> {
    const name: string | undefined = await vscode.window.showInputBox({
        prompt: vscode.l10n.t("Enter the new session name."),
        validateInput: (value: string): string | undefined => value && value.trim() ? undefined : vscode.l10n.t("Session name must not be empty"),
    });
    if (!name) {
        return;
    }

    const cookie: string | undefined = await vscode.window.showInputBox({
        prompt: vscode.l10n.t("Paste the Cookie header for this session."),
        placeHolder: "LEETCODE_SESSION=...; csrftoken=...",
        password: true,
        ignoreFocusOut: true,
        validateInput: (value: string): string | undefined => validateCookie(value),
    });
    if (!cookie) {
        return;
    }

    try {
        await leetCodeManager.createProfile(name.trim(), cookie);
        await vscode.commands.executeCommand("leetcode.refreshExplorer");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to create the session. Please open the output channel for details.", DialogType.error);
    }
}

async function deleteSession(): Promise<void> {
    const choice: IQuickItemEx<ISession | string> | undefined = await vscode.window.showQuickPick(
        parseSessionsToPicks(false),
        { placeHolder: "Please select the session you want to delete" },
    );
    if (!choice) {
        return;
    }

    const selectedSession: ISession = choice.value as ISession;
    if (selectedSession.active) {
        vscode.window.showInformationMessage(vscode.l10n.t("Cannot delete an active session."));
        return;
    }

    const action: vscode.MessageItem | undefined = await vscode.window.showWarningMessage(
        vscode.l10n.t("This operation cannot be reverted. Are you sure to delete the session: {0}?", selectedSession.name),
        DialogOptions.yes,
        DialogOptions.no,
    );
    if (action !== DialogOptions.yes) {
        return;
    }

    try {
        await leetCodeManager.deleteProfile(selectedSession.name);
        await vscode.commands.executeCommand("leetcode.refreshExplorer");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to delete the session. Please open the output channel for details.", DialogType.error);
    }
}
