"use strict";

import * as path from "path";
import * as vscode from "vscode";

export const leetCodeBinaryPath: string = path.join(__dirname, "..", "..", "node_modules", "leetcode-cli", "bin", "leetcode");

export interface IQuickItemEx<T> extends vscode.QuickPickItem {
    value: T;
}
