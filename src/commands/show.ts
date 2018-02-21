"use strict";

import * as fse from "fs-extra";
import * as vscode from "vscode";
import { LeetCodeNode } from "../leetCodeExplorer";
import { leetCodeManager } from "../leetCodeManager";
import { IQuickItemEx, languages, leetCodeBinaryPath } from "../shared";
import { executeCommand } from "../utils/cpUtils";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { selectWorkspaceFolder } from "../utils/workspaceUtils";
import * as list from "./list";

export async function showProblem(channel: vscode.OutputChannel, node?: LeetCodeNode): Promise<void> {
    if (!node) {
        return;
    }
    await showProblemInternal(channel, node.id.split(".")[1]);
}

export async function searchProblem(channel: vscode.OutputChannel): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
        parseProblemsToPicks(list.listProblems(channel)),
        {
            matchOnDetail: true,
            placeHolder: "Select one problem",
        },
    );
    if (!choice) {
        return;
    }
    await showProblemInternal(channel, choice.value);
}

async function showProblemInternal(channel: vscode.OutputChannel, id: string): Promise<void> {
    try {
        const language: string | undefined = await vscode.window.showQuickPick(languages, { placeHolder: "Select the language you want to use" });
        if (!language) {
            return;
        }
        const outdir: string = await selectWorkspaceFolder();
        await fse.ensureDir(outdir);
        const result: string = await executeCommand(channel, "node", [leetCodeBinaryPath, "show", id, "-gx", "-l", language, "-o", outdir]);
        const reg: RegExp = /\* Source Code:\s*(.*)/;
        const match: RegExpMatchArray | null = result.match(reg);
        if (match && match.length >= 2) {
            await vscode.window.showTextDocument(vscode.Uri.file(match[1].trim()), { preview: false });
        } else {
            throw new Error("Failed to fetch the problem information");
        }
    } catch (error) {
        await promptForOpenOutputChannel("Failed to fetch the problem information. Please open the output channel for details", DialogType.error, channel);
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
