// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as path from "path";
import * as unescapeJS from "unescape-js";
import * as vscode from "vscode";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { leetCodeChannel } from "../leetCodeChannel";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, IQuickItemEx, languages, ProblemState } from "../shared";
import { DialogOptions, DialogType, openSettingsEditor, promptForOpenOutputChannel, promptForSignIn, promptHintMessage } from "../utils/uiUtils";
import { selectWorkspaceFolder } from "../utils/workspaceUtils";
import * as wsl from "../utils/wslUtils";
import { leetCodePreviewProvider } from "../webview/leetCodePreviewProvider";
import { leetCodeSolutionProvider } from "../webview/leetCodeSolutionProvider";
import * as list from "./list";

export async function previewProblem(node: IProblem, isSideMode: boolean = false): Promise<void> {
    const descString: string = await leetCodeExecutor.getDescription(node);
    leetCodePreviewProvider.show(descString, node, isSideMode);
}

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
    const choice: IQuickItemEx<IProblem> | undefined = await vscode.window.showQuickPick(
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

export async function showSolution(input: LeetCodeNode | vscode.Uri): Promise<void> {
    let problemInput: string | undefined;
    if (input instanceof LeetCodeNode) {
        problemInput = input.id;
    } else if (input instanceof vscode.Uri) {
        problemInput = `"${input.fsPath}"`;
    } else {
        vscode.window.showErrorMessage("Invalid input to fetch the solution data");
        return;
    }

    const language: string | undefined = await fetchProblemLanguage();
    if (!language) {
        return;
    }
    try {
        const solution: string = await leetCodeExecutor.showSolution(problemInput, language);
        leetCodeSolutionProvider.show(unescapeJS(solution));
    } catch (error) {
        leetCodeChannel.appendLine(error.toString());
        await promptForOpenOutputChannel("Failed to fetch the top voted solution. Please open the output channel for details.", DialogType.error);
    }
}

async function fetchProblemLanguage(): Promise<string | undefined> {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    let defaultLanguage: string | undefined = leetCodeConfig.get<string>("defaultLanguage");
    if (defaultLanguage && languages.indexOf(defaultLanguage) < 0) {
        defaultLanguage = undefined;
    }
    const language: string | undefined = defaultLanguage || await vscode.window.showQuickPick(languages, { placeHolder: "Select the language you want to use", ignoreFocusOut: true });
    // fire-and-forget default language query
    (async (): Promise<void> => {
        if (language && !defaultLanguage && leetCodeConfig.get<boolean>("hint.setDefaultLanguage")) {
            const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
                `Would you like to set '${language}' as your default language?`,
                DialogOptions.yes,
                DialogOptions.no,
                DialogOptions.never,
            );
            if (choice === DialogOptions.yes) {
                leetCodeConfig.update("defaultLanguage", language, true /* UserSetting */);
            } else if (choice === DialogOptions.never) {
                leetCodeConfig.update("hint.setDefaultLanguage", false, true /* UserSetting */);
            }
        }
    })();
    return language;
}

async function showProblemInternal(node: IProblem): Promise<void> {
    try {
        const language: string | undefined = await fetchProblemLanguage();
        if (!language) {
            return;
        }

        const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
        let outDir: string = await selectWorkspaceFolder();
        let relativePath: string = (leetCodeConfig.get<string>("outputFolder", "")).trim();
        if (relativePath) {
            relativePath = await resolveRelativePath(relativePath, node, language);
            if (!relativePath) {
                leetCodeChannel.appendLine("Showing problem canceled by user.");
                return;
            }
        }

        outDir = path.join(outDir, relativePath);
        await fse.ensureDir(outDir);

        const originFilePath: string = await leetCodeExecutor.showProblem(node, language, outDir, leetCodeConfig.get<boolean>("showCommentDescription"));
        const filePath: string = wsl.useWsl() ? await wsl.toWinPath(originFilePath) : originFilePath;
        await Promise.all([
            vscode.window.showTextDocument(vscode.Uri.file(filePath), { preview: false, viewColumn: vscode.ViewColumn.One }),
            movePreviewAsideIfNeeded(node),
            promptHintMessage(
                "hint.commentDescription",
                'You can generate the code file with problem description in the comments by enabling "leetcode.showCommentDescription".',
                "Open settings",
                (): Promise<any> => openSettingsEditor("leetcode.showCommentDescription"),
            ),
        ]);
    } catch (error) {
        await promptForOpenOutputChannel(`${error} Please open the output channel for details.`, DialogType.error);
    }
}

async function movePreviewAsideIfNeeded(node: IProblem): Promise<void> {
    if (vscode.workspace.getConfiguration("leetcode").get<boolean>("enableSideMode", true)) {
        return previewProblem(node, true);
    }
}

async function parseProblemsToPicks(p: Promise<IProblem[]>): Promise<Array<IQuickItemEx<IProblem>>> {
    return new Promise(async (resolve: (res: Array<IQuickItemEx<IProblem>>) => void): Promise<void> => {
        const picks: Array<IQuickItemEx<IProblem>> = (await p).map((problem: IProblem) => Object.assign({}, {
            label: `${parseProblemDecorator(problem.state, problem.locked)}${problem.id}.${problem.name}`,
            description: "",
            detail: `AC rate: ${problem.passRate}, Difficulty: ${problem.difficulty}`,
            value: problem,
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

async function resolveRelativePath(relativePath: string, node: IProblem, selectedLanguage: string): Promise<string> {
    if (/\$\{tag\}/i.test(relativePath)) {
        const tag: string | undefined = await resolveTagForProblem(node);
        if (!tag) {
            return "";
        }
        relativePath = relativePath.replace(/\$\{tag\}/ig, tag);
    }

    relativePath = relativePath.replace(/\$\{language\}/ig, selectedLanguage);
    relativePath = relativePath.replace(/\$\{difficulty\}/ig, node.difficulty.toLocaleLowerCase());

    // Check if there is any unsupported configuration
    const matchResult: RegExpMatchArray | null = relativePath.match(/\$\{(.*?)\}/);
    if (matchResult && matchResult.length >= 1) {
        const errorMsg: string = `The config '${matchResult[1]}' is not supported.`;
        leetCodeChannel.appendLine(errorMsg);
        throw new Error(errorMsg);
    }

    return relativePath;
}

async function resolveTagForProblem(problem: IProblem): Promise<string | undefined> {
    if (problem.tags.length === 1) {
        return problem.tags[0];
    }
    return await vscode.window.showQuickPick(
        problem.tags,
        {
            matchOnDetail: true,
            placeHolder: "Multiple tags available, please select one",
            ignoreFocusOut: true,
        },
    );
}
