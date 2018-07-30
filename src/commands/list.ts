"use strict";

import * as vscode from "vscode";
import { leetCodeManager } from "../leetCodeManager";
import { leetCodeBinaryPath, ProblemState, UserStatus } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export interface IProblem {
    favorite: boolean;
    locked: boolean;
    state: ProblemState;
    id: string;
    name: string;
    difficulty: string;
    passRate: string;
}

export async function listProblems(): Promise<IProblem[]> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return [];
        }
        const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
        const showLocked: boolean | undefined = leetCodeConfig.get<boolean>("showLocked");
        const result: string = await executeCommand("node", showLocked ? [leetCodeBinaryPath, "list"] : [leetCodeBinaryPath, "list", "-q", "L"]);
        const problems: IProblem[] = [];
        const lines: string[] = result.split("\n");
        const reg: RegExp = /^(.)\s(.{1,2})\s(.)\s\[\s*(\d*)\]\s*(.*)\s*(Easy|Medium|Hard)\s*\((\s*\d+\.\d+ %)\)/;
        for (const line of lines) {
            const match: RegExpMatchArray | null = line.match(reg);
            if (match && match.length === 8) {
                problems.push({
                    favorite: match[1].trim().length > 0,
                    locked: match[2].trim().length > 0,
                    state: parseProblemState(match[3]),
                    id: match[4].trim(),
                    name: match[5].trim(),
                    difficulty: match[6].trim(),
                    passRate: match[7].trim(),
                });
            }
        }
        return problems.reverse();
    } catch (error) {
        await promptForOpenOutputChannel("Failed to list problems. Please open the output channel for details.", DialogType.error);
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
