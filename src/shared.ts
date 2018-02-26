"use strict";

import * as path from "path";
import * as vscode from "vscode";

export const leetCodeBinaryPath: string = path.join(__dirname, "..", "..", "node_modules", "leetcode-cli", "bin", "leetcode");

export interface IQuickItemEx<T> extends vscode.QuickPickItem {
    value: T;
}

export enum UserStatus {
    SignedIn = 1,
    SignedOut = 2,
}

export const languages = [
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
