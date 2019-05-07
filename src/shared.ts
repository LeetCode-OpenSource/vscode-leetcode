// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

export interface IQuickItemEx<T> extends vscode.QuickPickItem {
    value: T;
}

export enum UserStatus {
    SignedIn = 1,
    SignedOut = 2,
}

export const languages: string[] = [
    "bash",
    "c",
    "cpp",
    "csharp",
    "golang",
    "java",
    "javascript",
    "kotlin",
    "mysql",
    "php",
    "python",
    "python3",
    "ruby",
    "rust",
    "scala",
    "swift",
];

export const langExt: Map<string, string> = new Map([
    ["bash", "sh"],
    ["c", "c"],
    ["cpp", "cpp"],
    ["csharp", "cs"],
    ["golang", "go"],
    ["java", "java"],
    ["javascript", "js"],
    ["kotlin", "kt"],
    ["mysql", "sql"],
    ["php", "php"],
    ["python", "py"],
    ["python3", "py"],
    ["ruby", "rb"],
    ["rust", "rs"],
    ["scala", "scala"],
    ["swift", "swift"],
]);

export enum ProblemState {
    AC = 1,
    NotAC = 2,
    Unknown = 3,
}

export enum Endpoint {
    LeetCode = "leetcode",
    LeetCodeCN = "leetcode-cn",
}

export interface IProblem {
    isFavorite: boolean;
    locked: boolean;
    state: ProblemState;
    id: string;
    name: string;
    difficulty: string;
    passRate: string;
    companies: string[];
    tags: string[];
}

export const defaultProblem: IProblem = {
    isFavorite: false,
    locked: false,
    state: ProblemState.Unknown,
    id: "",
    name: "",
    difficulty: "",
    passRate: "",
    companies: [] as string[],
    tags: [] as string[],
};

export enum Category {
    All = "All",
    Difficulty = "Difficulty",
    Tag = "Tag",
    Company = "Company",
    Favorite = "Favorite",
}

export const supportedPlugins: string[] = [
    "company",
    "solution.discuss",
    "leetcode.cn",
];
