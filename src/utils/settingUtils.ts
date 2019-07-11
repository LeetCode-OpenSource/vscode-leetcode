// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as os from "os";
import { workspace, WorkspaceConfiguration } from "vscode";

export function getWorkspaceConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration("leetcode");
}

export function shouldHideSolvedProblem(): boolean {
    return getWorkspaceConfiguration().get<boolean>("hideSolved", false);
}

export function getWorkspaceFolder(): string {
    const rawWorkspaceFolder: string = getWorkspaceConfiguration().get<string>("workspaceFolder", "${home}/.leetcode");
    return rawWorkspaceFolder.replace(/\${home}/i, os.homedir());
}

export function getEditorShortcuts(): string[] {
    return getWorkspaceConfiguration().get<string[]>("editor.shortcuts", ["submit", "test"]);
}
