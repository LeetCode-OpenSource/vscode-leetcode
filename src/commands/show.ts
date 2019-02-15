// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, IQuickItemEx, languages, ProblemState } from "../shared";
import { DialogOptions, DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { selectWorkspaceFolder } from "../utils/workspaceUtils";
import * as wsl from "../utils/wslUtils";
import * as list from "./list";

export async function showProblem(node?: LeetCodeNode): Promise<void> {
    if (!node) {
        return;
    }
    await showProblemInternal(node);
}

export async function searchProblem(): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const problems: IProblem[] = await list.listProblems();
    const choice: IQuickItemEx<string> | undefined = await vscode.window.showQuickPick(
        parseProblemsToPicks(problems),
        {
            matchOnDetail: true,
            placeHolder: "Select one problem",
        },
    );
    if (!choice) {
        return;
    }
    await showProblemInternal(problems.find((problem: IProblem) => problem.id === choice.value) as IProblem);
}

async function showProblemInternal(node: IProblem): Promise<void> {
    try {
        const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
        let defaultLanguage: string | undefined = leetCodeConfig.get<string>("defaultLanguage");
        if (defaultLanguage && languages.indexOf(defaultLanguage) < 0) {
            defaultLanguage = undefined;
        }
        const language: string | undefined = defaultLanguage || await vscode.window.showQuickPick(languages, { placeHolder: "Select the language you want to use" });
        if (!language) {
            return;
        }

        let outDir: string = await selectWorkspaceFolder();
        const outputPathCfg: string = leetCodeConfig.get<string>("outputPath") || "";
        const outputPath: RegExpMatchArray | null = outputPathCfg.match(/\$\{(.*?)\}/);
        if (outputPath) {
            switch (outputPath[1].toLowerCase()) {
                case "tag": {
                    const closestTag: string = node.tags.reduce((prev: string, curr: string) => {
                        return curr.length > prev.length ?
                            curr :
                            prev;
                    }, "");
                    outDir = path.join(outDir, closestTag);
                    break;
                }
                case "language": {
                    outDir = path.join(outDir, language);
                    break;
                }
                case "difficulty": {
                    outDir = path.join(outDir, node.difficulty);
                    break;
                }
                default: {
                    break;
                }

            }
        }
        await fse.ensureDir(outDir);
        const result: string = await leetCodeExecutor.showProblem(node.id, language, outDir);
        const reg: RegExp = /\* Source Code:\s*(.*)/;
        const match: RegExpMatchArray | null = result.match(reg);
        if (match && match.length >= 2) {
            const filePath: string = wsl.useWsl() ? await wsl.toWinPath(match[1].trim()) : match[1].trim();

            await vscode.window.showTextDocument(vscode.Uri.file(filePath), { preview: false });
        } else {
            throw new Error("Failed to fetch the problem information.");
        }

        if (!defaultLanguage && leetCodeConfig.get<boolean>("showSetDefaultLanguageHint")) {
            const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
                `Would you like to set '${language}' as your default language?`,
                DialogOptions.yes,
                DialogOptions.no,
                DialogOptions.never,
            );
            if (choice === DialogOptions.yes) {
                leetCodeConfig.update("defaultLanguage", language, true /* UserSetting */);
            } else if (choice === DialogOptions.never) {
                leetCodeConfig.update("showSetDefaultLanguageHint", false, true /* UserSetting */);
            }
        }
    } catch (error) {
        await promptForOpenOutputChannel("Failed to fetch the problem information. Please open the output channel for details.", DialogType.error);
    }
}

async function parseProblemsToPicks(p: IProblem[]): Promise<Array<IQuickItemEx<string>>> {
    return new Promise(async (resolve: (res: Array<IQuickItemEx<string>>) => void): Promise<void> => {
        const picks: Array<IQuickItemEx<string>> = p.map((problem: IProblem) => Object.assign({}, {
            label: `${parseProblemDecorator(problem.state, problem.locked)}${problem.id}.${problem.name}`,
            description: "",
            detail: `AC rate: ${problem.passRate}, Difficulty: ${problem.difficulty}`,
            value: problem.id,
        }));
        resolve(picks);
    });
}

function parseProblemDecorator(state: ProblemState, locked: boolean): string {
    switch (state) {
        case ProblemState.AC:
            return "$(check) ";
        case ProblemState.NotAC:
            return "$(x) ";
        default:
            return locked ? "$(lock) " : "";
    }
}
