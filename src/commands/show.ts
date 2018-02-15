"use strict";

import * as vscode from "vscode";
import { LeetCodeNode } from "../leetCodeExplorer";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx, languages, leetCodeBinaryPath } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { selectWorkspaceFolder } from "../utils/workspaceUtils";
import * as list from "./list";

export async function showProblem(node?: LeetCodeNode): Promise<void> {
    if (!node) {
        return;
    }
    await showProblemInternal(node.id);
}

export async function searchProblem(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
        parseProblemsToPicks(list.listProblems()),
        {
            matchOnDetail: true,
            placeHolder: "Select one problem",
        },
    );
    if (!choice) {
        return;
    }
    await showProblemInternal(choice.value);
}

async function showProblemInternal(id: string): Promise<void> {
    try {
        const language: string | undefined = await vscode.window.showQuickPick(languages, { placeHolder: "Select the language you want to use" });
        if (!language) {
            return;
        }
        const outdir: string = await selectWorkspaceFolder();
        const result: string = await executeCommand("node", [leetCodeBinaryPath, "show", id, "-gx", "-l", language, "-o", outdir]);
        const reg: RegExp = /\* Source Code:\s*(.*)/;
        const match: RegExpMatchArray | null = result.match(reg);
        if (match && match.length >= 2) {
            await vscode.window.showTextDocument(vscode.Uri.file(match[1].trim()));
        } else {
            throw new Error("Failed to fetch the problem information");
        }
    } catch (error) {
        await promptForOpenOutputChannel("Failed to fetch the problem information. Please open the output channel for details", DialogType.error);
    }
}

async function parseProblemsToPicks(p: Promise<list.IProblem[]>): Promise<Array<IQuickItemEx<string>>> {
    return new Promise(async (resolve: (res: Array<IQuickItemEx<string>>) => void): Promise<void> => {
        const picks: Array<IQuickItemEx<string>> = (await p).map((problem: list.IProblem) => Object.assign({}, {
            label: `${problem.solved ? "$(check) " : ""}${problem.id}.${problem.name}`,
            description: "",
            detail: `AC rate: ${problem.passRate}, Difficulty: ${problem.difficulty}`,
            value: problem.id,
        }));
        resolve(picks);
    });
}
