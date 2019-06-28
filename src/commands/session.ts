// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx } from "../shared";
import { DialogOptions, DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";

export async function getSessionList(): Promise<ISession[]> {
    const signInStatus: string | undefined = leetCodeManager.getUser();
    if (!signInStatus) {
        promptForSignIn();
        return [];
    }
    const result: string = await leetCodeExecutor.listSessions();
    const lines: string[] = result.split("\n");
    const sessions: ISession[] = [];
    const reg: RegExp = /(.?)\s*(\d+)\s+(.*)\s+(\d+ \(\s*\d+\.\d+ %\))\s+(\d+ \(\s*\d+\.\d+ %\))/;
    for (const line of lines) {
        const match: RegExpMatchArray | null = line.match(reg);
        if (match && match.length === 6) {
            sessions.push({
                active: !!(match[1].trim()),
                id: match[2].trim(),
                name: match[3].trim(),
                acQuestions: match[4].trim(),
                acSubmits: match[5].trim(),
            });
        }
    }
    return sessions;
}

export async function manageSessions(): Promise<void> {
    const choice: IQuickItemEx<ISession | string> | undefined = await vscode.window.showQuickPick(parseSessionsToPicks(true /* includeOperation */));
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
        await leetCodeExecutor.enableSession((choice.value as ISession).id);
        vscode.window.showInformationMessage(`Successfully switched to session '${choice.label}'.`);
        await vscode.commands.executeCommand("leetcode.refreshExplorer");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to switch session. Please open the output channel for details.", DialogType.error);
    }
}

async function parseSessionsToPicks(includeOperations: boolean = false): Promise<Array<IQuickItemEx<ISession | string>>> {
    return new Promise(async (resolve: (res: Array<IQuickItemEx<ISession | string>>) => void): Promise<void> => {
        try {
            const sessions: ISession[] = await getSessionList();
            const picks: Array<IQuickItemEx<ISession | string>> = sessions.map((s: ISession) => Object.assign({}, {
                label: `${s.active ? "$(check) " : ""}${s.name}`,
                description: s.active ? "Active" : "",
                detail: `AC Questions: ${s.acQuestions}, AC Submits: ${s.acSubmits}`,
                value: s,
            }));

            if (includeOperations) {
                picks.push(...parseSessionManagementOperations());
            }
            resolve(picks);
        } catch (error) {
            return await promptForOpenOutputChannel("Failed to list sessions. Please open the output channel for details.", DialogType.error);
        }
    });
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
    const session: string | undefined = await vscode.window.showInputBox({
        prompt: "Enter the new session name.",
        validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "Session name must not be empty",
    });
    if (!session) {
        return;
    }
    try {
        await leetCodeExecutor.createSession(session);
        vscode.window.showInformationMessage("New session created, you can switch to it by clicking the status bar.");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to create session. Please open the output channel for details.", DialogType.error);
    }
}

async function deleteSession(): Promise<void> {
    const choice: IQuickItemEx<ISession | string> | undefined = await vscode.window.showQuickPick(
        parseSessionsToPicks(false /* includeOperation */),
        { placeHolder: "Please select the session you want to delete" },
    );
    if (!choice) {
        return;
    }

    const selectedSession: ISession = choice.value as ISession;
    if (selectedSession.active) {
        vscode.window.showInformationMessage("Cannot delete an active session.");
        return;
    }

    const action: vscode.MessageItem | undefined = await vscode.window.showWarningMessage(
        `This operation cannot be reverted. Are you sure to delete the session: ${selectedSession.name}?`,
        DialogOptions.yes,
        DialogOptions.no,
    );
    if (action !== DialogOptions.yes) {
        return;
    }

    const confirm: string | undefined = await vscode.window.showInputBox({
        prompt: "Enter 'yes' to confirm deleting the session",
        validateInput: (value: string): string => {
            if (value === "yes") {
                return "";
            } else {
                return "Enter 'yes' to confirm";
            }
        },
    });

    if (confirm === "yes") {
        await leetCodeExecutor.deleteSession(selectedSession.id);
        vscode.window.showInformationMessage("The session has been successfully deleted.");
    }
}

export interface ISession {
    active: boolean;
    id: string;
    name: string;
    acQuestions: string;
    acSubmits: string;
}
