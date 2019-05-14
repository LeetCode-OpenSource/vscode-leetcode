// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { workspace, WorkspaceConfiguration } from "vscode";

export function getWorkspaceConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration("leetcode");
}

export function shouldHideSolvedProblem(): boolean {
    return getWorkspaceConfiguration().get<boolean>("hideSolved", false);
}
