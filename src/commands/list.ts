// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { leetCodeChannel } from "../leetCodeChannel";
import { IProblem, UserStatus } from "../shared";
import { IProblemListRow, parseProblemListLine } from "../utils/parseUtils";
import * as settingUtils from "../utils/settingUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function listProblems(): Promise<IProblem[]> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return [];
        }

        const useEndpointTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const result: string = await leetCodeExecutor.listProblems(true, useEndpointTranslation);
        const problems: IProblem[] = [];
        const lines: string[] = result.split("\n");

        // Company/tag data is supplementary. A failure there must not wipe the
        // whole tree, so it is fetched defensively and degraded to empty.
        let companies: { [key: string]: string[] } = {};
        let tags: { [key: string]: string[] } = {};
        try {
            const extra = await leetCodeExecutor.getCompaniesAndTags();
            companies = extra.companies;
            tags = extra.tags;
        } catch (extraError) {
            leetCodeChannel.appendLine(`Failed to load company/tag metadata, continuing without it: ${extraError}`);
        }

        let skipped: number = 0;
        for (const line of lines) {
            if (!line.trim()) {
                continue;
            }
            const row: IProblemListRow | undefined = parseProblemListLine(line);
            if (!row) {
                skipped += 1;
                continue;
            }
            problems.push({
                id: row.id,
                isFavorite: row.isFavorite,
                locked: row.locked,
                state: row.state,
                name: row.name,
                difficulty: row.difficulty,
                passRate: row.passRate,
                companies: companies[row.id] || ["Unknown"],
                tags: tags[row.id] || ["Unknown"],
            });
        }

        if (problems.length === 0 && skipped > 0) {
            // Previously this produced a silently empty tree.
            leetCodeChannel.appendLine(`Could not parse any problem from ${skipped} line(s) of CLI output:`);
            leetCodeChannel.appendLine(result);
            throw new Error("The LeetCode CLI returned output that could not be parsed. See the output channel.");
        }
        if (skipped > 0) {
            leetCodeChannel.appendLine(`Skipped ${skipped} unparseable line(s) from the problem list.`);
        }
        return problems.reverse();
    } catch (error) {
        leetCodeChannel.appendLine(`${error}`);
        if (error && (error as any).result) {
            leetCodeChannel.appendLine(`${(error as any).result}`);
        }
        await promptForOpenOutputChannel("Failed to list problems. Please open the output channel for details.", DialogType.error);
        return [];
    }
}
