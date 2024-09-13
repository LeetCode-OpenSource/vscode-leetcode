// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { workspace, WorkspaceConfiguration } from "vscode";
import { DescriptionConfiguration } from "../shared";
import { sep } from "path";


export function getWorkspaceConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration("leetcode");
}

export function shouldHideSolvedProblem(): boolean {
    return getWorkspaceConfiguration().get<boolean>("hideSolved", false);
}

export function getWorkspaceFolder(): string {
    return substitute(getWorkspaceConfiguration().get<string>("workspaceFolder", ""));
}

export function getEditorShortcuts(): string[] {
    return getWorkspaceConfiguration().get<string[]>("editor.shortcuts", ["submit", "test"]);
}

export function hasStarShortcut(): boolean {
    const shortcuts: string[] = getWorkspaceConfiguration().get<string[]>("editor.shortcuts", ["submit", "test"]);
    return shortcuts.indexOf("star") >= 0;
}

export function shouldUseEndpointTranslation(): boolean {
    return getWorkspaceConfiguration().get<boolean>("useEndpointTranslation", true);
}

export function getDescriptionConfiguration(): IDescriptionConfiguration {
    const setting: string = getWorkspaceConfiguration().get<string>("showDescription", DescriptionConfiguration.InWebView);
    const config: IDescriptionConfiguration = {
        showInComment: false,
        showInWebview: true,
    };
    switch (setting) {
        case DescriptionConfiguration.Both:
            config.showInComment = true;
            config.showInWebview = true;
            break;
        case DescriptionConfiguration.None:
            config.showInComment = false;
            config.showInWebview = false;
            break;
        case DescriptionConfiguration.InFileComment:
            config.showInComment = true;
            config.showInWebview = false;
            break;
        case DescriptionConfiguration.InWebView:
            config.showInComment = false;
            config.showInWebview = true;
            break;
    }

    // To be compatible with the deprecated setting:
    if (getWorkspaceConfiguration().get<boolean>("showCommentDescription")) {
        config.showInComment = true;
    }

    return config;
}

export interface IDescriptionConfiguration {
    showInComment: boolean;
    showInWebview: boolean;
}

function substitute<T>(val: T): T {
    if (typeof val == 'string') {
        val = val.replace(/\$\{(.*?)\}/g, (match, name) => {
            const rep = replace(name);
            return (rep === null) ? match : rep;
        }) as unknown as T;
    }
    return val;
}

function replace(name: string): string | null {
    if (name == 'pathSeparator') {
        return sep as string;
    }
    const envPrefix = 'env:';
    if (name.startsWith(envPrefix))
        return process.env[name.substring(envPrefix.length)] || '';
    const configPrefix = 'config:';
    if (name.startsWith(configPrefix)) {
        const config = workspace.getConfiguration().get(
            name.substring(configPrefix.length));
        return (typeof config == 'string') ? config : null;
    }
    return null;
}
