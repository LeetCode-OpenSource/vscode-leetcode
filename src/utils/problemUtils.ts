// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import * as vscode from "vscode";
import { extensionState } from "../extensionState";
import { IProblem, langExt } from "../shared";
import { isWindows, usingCmd } from "./osUtils";
import { useWsl } from "./wslUtils";

const fileMateReg: RegExp = /@lc\s+(?:[\s\S]*?)\s+id=(\d+)\s+lang=([\S]+)/;

const beforeStubReg: RegExp = /@before-stub-for-debug-begin([\s\S]*?)@before-stub-for-debug-end/;
const afterStubReg: RegExp = /@after-stub-for-debug-begin([\s\S]*?)@after-stub-for-debug-end/;

export function genFileExt(language: string): string {
    const ext: string | undefined = langExt.get(language);
    if (!ext) {
        throw new Error(`The language "${language}" is not supported.`);
    }
    return ext;
}

export function genFileName(node: IProblem, language: string): string {
    const slug: string = _.kebabCase(node.name);
    const ext: string = genFileExt(language);
    return `${node.id}.${slug}.${ext}`;
}

export async function getNodeIdFromFile(fsPath: string): Promise<string> {
    const fileContent: string = await fse.readFile(fsPath, "utf8");
    let id: string = "";
    const matchResults: RegExpMatchArray | null = fileContent.match(/@lc.+id=(.+?) /);
    if (matchResults && matchResults.length === 2) {
        id = matchResults[1];
    }
    // Try to get id from file name if getting from comments failed
    if (!id) {
        id = path.basename(fsPath).split(".")[0];
    }

    return id;
}

export function fileMeta(content: string): { id: string; lang: string } | null {
    const result: RegExpExecArray | null = fileMateReg.exec(content);
    if (result != null) {
        return {
            id: result[1],
            lang: result[2],
        };
    }
    return null;
}

export async function getUnstubedFile(filePath: string): Promise<string> {
    const content: string = (await fse.readFile(filePath)).toString();
    const stripped: string = content.replace(beforeStubReg, "").replace(afterStubReg, "");

    if (content.length === stripped.length) {
        // no stub, return original filePath
        return filePath;
    }

    const meta: { id: string; lang: string } | null = fileMeta(content);
    if (meta == null) {
        vscode.window.showErrorMessage(
            "File meta info has been changed, please check the content: '@lc app=leetcode.cn id=xx lang=xx'.",
        );
        throw new Error("");
    }

    const newPath: string = path.join(extensionState.cachePath, `${meta.id}-${meta.lang}`);
    await fse.writeFile(newPath, stripped);
    return newPath;
}

async function getProblemSpecialCode(
    language: string,
    problem: string,
    fileExt: string,
    extDir: string,
): Promise<string> {
    const problemPath: string = path.join(extDir, "src/debug/entry", language, "problems", `${problem}.${fileExt}`);
    const isSpecial: boolean = await fse.pathExists(problemPath);
    if (isSpecial) {
        const specialContent: Buffer = await fse.readFile(problemPath);
        return specialContent.toString();
    }
    const fileContent: Buffer = await fse.readFile(
        path.join(extDir, "src/debug/entry", language, "problems", `common.${fileExt}`),
    );
    return fileContent.toString();
}

export async function getEntryFile(language: string, problem: string): Promise<string> {
    const extDir: string = vscode.extensions.getExtension("shengchen.vscode-leetcode")!.extensionPath;
    const fileExt: string = genFileExt(language);
    const specialCode: string = await getProblemSpecialCode(language, problem, fileExt, extDir);
    const tmpEntryCode: string = (
        await fse.readFile(path.join(extDir, "src/debug/entry", language, `entry.${fileExt}`))
    ).toString();
    const entryCode: string = tmpEntryCode.replace(/\/\/ @@stub-for-code@@/, specialCode);
    const entryPath: string = path.join(extensionState.cachePath, `${language}problem${problem}.${fileExt}`);
    await fse.writeFile(entryPath, entryCode);
    return entryPath;
}

export function parseTestString(test: string): string {
    if (useWsl() || !isWindows()) {
        return `'${test}'`;
    }

    // In windows and not using WSL
    if (usingCmd()) {
        return `"${test.replace(/"/g, '\\"')}"`;
    } else {
        // Assume using PowerShell
        return `'${test.replace(/"/g, '\\"')}'`;
    }
}
