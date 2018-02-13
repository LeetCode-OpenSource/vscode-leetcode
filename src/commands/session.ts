"use strict";

import * as vscode from "vscode";
import { IQuickItemEx, leetCodeBinaryPath } from "../shared";
import * as cp from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";
import { getSignedInAccount } from "./user";

export async function getSessionList(): Promise<ISession[]> {
    const signInStatus = await getSignedInAccount();
    if (!signInStatus) {
        return [];
    }
    const result: string = await cp.executeCommand("node", [leetCodeBinaryPath, "session"]);
    const lines: string[] = result.split("\n");
    const sessions: ISession[] = [];
    const reg: RegExp = /(✔?)\s*(\d+)\s+(.*)\s+(\d+ \(\s*\d+\.\d+ %\))\s+(\d+ \(\s*\d+\.\d+ %\))/;
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
    if (!choice || choice.label.indexOf("✔") > -1) {
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
            label: `${s.active ? "✔ " : ""}${s.name}`,
            description: `ID: ${s.id}`,
            detail: `AC Questions: ${s.acQuestions}, AC Submits: ${s.acSubmits}`,
            value: s.id,
        }));
        resolve(picks);
    });
}

export interface ISession {
    active: boolean;
    id: string;
    name: string;
    acQuestions: string;
    acSubmits: string;
}
