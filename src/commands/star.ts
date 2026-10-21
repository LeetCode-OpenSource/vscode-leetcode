// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { fetchQuestionDetail } from "../api/question";
import { setFavorite } from "../api/favorite";
import { getLeetCodeRequest } from "../api/request";
import { updateCachedFavorite } from "../api/problems";
import { customCodeLensProvider } from "../codelens/CustomCodeLensProvider";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { hasStarShortcut } from "../utils/settingUtils";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function addFavorite(node: LeetCodeNode): Promise<void> {
    await toggleFavorite(node, true);
}

export async function removeFavorite(node: LeetCodeNode): Promise<void> {
    await toggleFavorite(node, false);
}

async function toggleFavorite(node: LeetCodeNode, favorite: boolean): Promise<void> {
    try {
        const request = getLeetCodeRequest();
        const detail = await fetchQuestionDetail(request, node.slug);
        await setFavorite(request, { slug: node.slug, questionId: detail.questionId }, favorite);
        updateCachedFavorite(node.id, favorite);
        await leetCodeTreeDataProvider.refresh();
        if (hasStarShortcut()) {
            customCodeLensProvider.refresh();
        }
    } catch (error) {
        const action: string = favorite ? "add the problem to favorite" : "remove the problem from favorite";
        await promptForOpenOutputChannel(`Failed to ${action}. Please open the output channel for details.`, DialogType.error);
    }
}
