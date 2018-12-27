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
    "python",
    "python3",
    "ruby",
    "scala",
    "swift",
];

export enum ProblemState {
    AC = 1,
    NotAC = 2,
    Unknown = 3,
}

export enum Endpoint {
    LeetCode = "leetcode",
    LeetCodeCN = "leetcode-cn",
}
