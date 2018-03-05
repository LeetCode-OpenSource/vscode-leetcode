"use strict";

import * as vscode from "vscode";
import { leetCodeManager } from "../leetCodeManager";
import { leetCodeBinaryPath, ProblemState, UserStatus } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export interface IProblem {
    state: ProblemState;
    id: string;
    name: string;
    difficulty: string;
    passRate: string;
}

export async function listProblems(channel: vscode.OutputChannel): Promise<IProblem[]> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return [];
        }
        const result: string = await executeCommand(channel, "node", [leetCodeBinaryPath, "list", "-q", "L"]);
        const problems: IProblem[] = [];
        const lines: string[] = result.split("\n");
        const reg: RegExp = /(.?)\s*\[\s*(\d*)\]\s*(.*)\s*(Easy|Medium|Hard)\s*\((\s*\d+\.\d+ %)\)/;
        for (const line of lines) {
            const match: RegExpMatchArray | null = line.match(reg);
            if (match && match.length === 6) {
                problems.push({
                    state: parseProblemState(match[1]),
                    id: match[2].trim(),
                    name: match[3].trim(),
                    difficulty: match[4].trim(),
                    passRate: match[5].trim(),
                });
            }
        }
        return problems.reverse();
    } catch (error) {
        await promptForOpenOutputChannel("Failed to list problems. Please open the output channel for details.", DialogType.error, channel);
        return [];
    }
}

function parseProblemState(stateOutput: string): ProblemState {
    if (!stateOutput) {
        return ProblemState.Unknown;
    }
    switch (stateOutput.trim()) {
        case "v":
        case "✔":
        case "√":
            return ProblemState.AC;
        case "X":
        case "✘":
        case "×":
            return ProblemState.NotAC;
        default:
            return ProblemState.Unknown;
    }
}
