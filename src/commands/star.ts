
// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { customCodeLensProvider } from "../codelens/CustomCodeLensProvider";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { hasStarShortcut } from "../utils/settingUtils";
import { promptForFailure } from "../utils/uiUtils";

export async function addFavorite(node: LeetCodeNode): Promise<void> {
    try {
        await leetCodeExecutor.toggleFavorite(node, true);
        await leetCodeTreeDataProvider.refresh();
        if (hasStarShortcut()) {
            customCodeLensProvider.refresh();
        }
    } catch (error) {
        await promptForFailure("Failed to add the problem to favorite.", error);
    }
}

export async function removeFavorite(node: LeetCodeNode): Promise<void> {
    try {
        await leetCodeExecutor.toggleFavorite(node, false);
        await leetCodeTreeDataProvider.refresh();
        if (hasStarShortcut()) {
            customCodeLensProvider.refresh();
        }
    } catch (error) {
        await promptForFailure("Failed to remove the problem from favorite.", error);
    }
}
