// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { QuickPickItem, window, workspace, WorkspaceConfiguration } from "vscode";
import { languages } from "../shared";

export async function switchDefaultLanguage(): Promise<void> {
    const leetCodeConfig: WorkspaceConfiguration = workspace.getConfiguration("leetcode");
    const defaultLanguage: string | undefined = leetCodeConfig.get<string>("defaultLanguage");
    const languageItems: QuickPickItem[] = [];
    for (const language of languages) {
        languageItems.push({
            label: language,
            description: defaultLanguage === language ? "Currently used" : undefined,
        });
    }
    // Put the default language at the top of the list
    languageItems.sort((a: QuickPickItem, b: QuickPickItem) => {
        if (a.description) {
            return Number.MIN_SAFE_INTEGER;
        } else if (b.description) {
            return Number.MAX_SAFE_INTEGER;
        }
        return a.label.localeCompare(b.label);
    });

    const selectedItem: QuickPickItem | undefined = await window.showQuickPick(languageItems, {
        placeHolder: "Please the default language",
        ignoreFocusOut: true,
    });

    if (!selectedItem) {
        return;
    }

    leetCodeConfig.update("defaultLanguage", selectedItem.label, true /* Global */);
    window.showInformationMessage(`Successfully set the default language to ${selectedItem.label}`);
}
