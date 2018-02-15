"use strict";

import * as vscode from "vscode";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx, leetCodeBinaryPath } from "../shared";
import * as cp from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";

export async function getSessionList(): Promise<ISession[]> {
    const signInStatus = leetCodeManager.getUser();
    if (!signInStatus) {
        promptForSignIn();
        return [];
    }
    const result: string = await cp.executeCommand("node", [leetCodeBinaryPath, "session"]);
    const lines: string[] = result.split("\n");
    const sessions: ISession[] = [];
    const reg: RegExp = /(.?)\s*(\d+)\s+(.*)\s+(\d+ \(\s*\d+\.\d+ %\))\s+(\d+ \(\s*\d+\.\d+ %\))/;
    for (const line of lines.map((l: string) => l.trim()).filter(Boolean)) {
        const match: RegExpMatchArray | null = line.match(reg);
        if (match && match.length === 6) {
            sessions.push({
                active: !!match[1],
                id: match[2].trim(),
                name: match[3].trim(),
                acQuestions: match[4].trim(),
                acSubmits: match[5].trim(),
            });
        }
    }
    return sessions;
}

export async function selectSession(): Promise<void> {
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(parseSessionsToPicks(getSessionList()));
    if (!choice || choice.description === "Active") {
        return;
    }
    if (choice.value === ":createNewSession") {
        await vscode.commands.executeCommand("leetcode.createSession");
        return;
    }
    try {
        await cp.executeCommand("node", [leetCodeBinaryPath, "session", "-e", choice.value]);
        vscode.window.showInformationMessage(`Successfully switched to session '${choice.label}'.`);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to switch session. Please open the output channel for details", DialogType.error);
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
            value: ":createNewSession",
        });
        resolve(picks);
    });
}

export async function createSession(): Promise<void> {
    const session: string | undefined = await vscode.window.showInputBox({
        prompt: "Enter the new session name.",
        validateInput: (s: string) => s.trim() ? undefined : "Session name must not be empty",
    });
    if (!session) {
        return;
    }
    try {
        await cp.executeCommand("node", [leetCodeBinaryPath, "session", "-c", session]);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to create session. Please open the output channel for details", DialogType.error);
    }
}

export interface ISession {
    active: boolean;
    id: string;
    name: string;
    acQuestions: string;
    acSubmits: string;
}
