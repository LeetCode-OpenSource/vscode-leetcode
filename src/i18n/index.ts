// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { en } from "./en";
import { zhCN } from "./zh-cn";

export enum Language {
    English = "en",
    Chinese = "zh-CN",
}

export type StringKey = keyof typeof en;

const languageMap: { [key: string]: { [key in StringKey]: string } } = {
    [Language.English]: en,
    [Language.Chinese]: zhCN,
};

export function getCurrentLanguage(): Language {
    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
    const setting: string = config.get<string>("language", "auto");
    if (setting === "auto") {
        const vscodeLang: string = vscode.env.language;
        if (vscodeLang.startsWith("zh")) {
            return Language.Chinese;
        }
        return Language.English;
    }
    return setting === "zh-CN" ? Language.Chinese : Language.English;
}

export function t(key: StringKey, ...args: (string | number)[]): string {
    const lang: Language = getCurrentLanguage();
    const strings = languageMap[lang] || en;
    let result: string = strings[key] || en[key] || key;
    // Replace {0}, {1}, etc. with args
    for (let i: number = 0; i < args.length; i++) {
        result = result.replace(`{${i}}`, String(args[i]));
    }
    return result;
}
