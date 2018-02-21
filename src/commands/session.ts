"use strict";

import * as vscode from "vscode";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx, leetCodeBinaryPath } from "../shared";
import * as cp from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";

export async function getSessionList(channel: vscode.OutputChannel): Promise<ISession[]> {
    const signInStatus = leetCodeManager.getUser();
    if (!signInStatus) {
        promptForSignIn();
        return [];
    }
    const result: string = await cp.executeCommand(channel, "node", [leetCodeBinaryPath, "session"]);
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

export async function selectSession(channel: vscode.OutputChannel): Promise<void> {
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(parseSessionsToPicks(getSessionList(channel)));
    if (!choice || choice.description === "Active") {
        return;
    }
    if (choice.value === ":createNewSession") {
        await vscode.commands.executeCommand("leetcode.createSession");
        return;
    }
    try {
        await cp.executeCommand(channel, "node", [leetCodeBinaryPath, "session", "-e", choice.value]);
        vscode.window.showInformationMessage(`Successfully switched to session '${choice.label}'.`);
        await vscode.commands.executeCommand("leetcode.refreshExplorer");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to switch session. Please open the output channel for details", DialogType.error, channel);
    }
}

async function parseSessionsToPicks(p: Promise<ISession[]>): Promise<Array<IQuickItemEx<string>>> {
    return new Promise(async (resolve: (res: Array<IQuickItemEx<string>>) => void): Promise<void> => {
        const picks: Array<IQuickItemEx<string>> = (await p).map((s: ISession) => Object.assign({}, {
            label: `${s.active ? "$(check) " : ""}${s.name}`,
            description: s.active ? "Active" : "",
            detail: `AC Questions: ${s.acQuestions}, AC Submits: ${s.acSubmits}`,
            value: s.id,
        }));
        picks.push({
            label: "$(plus) Create a new session",
            description: "",
            detail: "Click this item to create a new session",
            value: ":createNewSession",
        });
        resolve(picks);
    });
}

export async function createSession(channel: vscode.OutputChannel): Promise<void> {
    const session: string | undefined = await vscode.window.showInputBox({
        prompt: "Enter the new session name.",
        validateInput: (s: string) => s && s.trim() ? undefined : "Session name must not be empty",
    });
    if (!session) {
        return;
    }
    try {
        await cp.executeCommand(channel, "node", [leetCodeBinaryPath, "session", "-c", session]);
        vscode.window.showInformationMessage("New session created, you can switch to it by clicking the status bar.");
    } catch (error) {
        await promptForOpenOutputChannel("Failed to create session. Please open the output channel for details", DialogType.error, channel);
    }
}

export interface ISession {
    active: boolean;
    id: string;
    name: string;
    acQuestions: string;
    acSubmits: string;
}
