"use strict";

import { leetCodeManager } from "../leetCodeManager";
import { leetCodeBinaryPath } from "../shared";
import { UserStatus } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export interface IProblem {
    solved: boolean;
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
        const result: string = await executeCommand("node", [leetCodeBinaryPath, "list", "-q", "L"]);
        const problems: IProblem[] = [];
        const lines: string[] = result.split("\n");
        const reg: RegExp = /(.?)\s*\[\s*(\d*)\]\s*(.*)\s*(Easy|Medium|Hard)\s*\((\s*\d+\.\d+ %)\)/;
        for (const line of lines.map((l: string) => l.trim()).filter(Boolean)) {
            const match: RegExpMatchArray | null = line.match(reg);
            if (match && match.length === 6) {
                problems.push({
                    solved: !!match[1],
                    id: match[2].trim(),
                    name: match[3].trim(),
                    difficulty: match[4].trim(),
                    passRate: match[5].trim(),
                });
            }
        }
        return problems;
    } catch (error) {
        await promptForOpenOutputChannel("Failed to list problems. Please open the output channel for details", DialogType.error);
        return [];
    }

}
