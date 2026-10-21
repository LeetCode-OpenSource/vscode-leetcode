// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { getProblems } from "../api/problems";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, UserStatus } from "../shared";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

/**
 * Returns the problem list for the active endpoint. The first call loads all
 * pages from GraphQL; later calls reuse the cache until it expires or the user
 * explicitly refreshes.
 */
export async function listProblems(forceRefresh: boolean = false): Promise<IProblem[]> {
    if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
        return [];
    }

    try {
        return await getProblems(forceRefresh);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to list problems. Please open the output channel for details.", DialogType.error);
        return [];
    }
}
