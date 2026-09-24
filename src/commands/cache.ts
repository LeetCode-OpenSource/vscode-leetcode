// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { leetCodeExecutor } from "../leetCodeExecutor";
import { promptForFailure } from "../utils/uiUtils";

export async function deleteCache(): Promise<void> {
    try {
        await leetCodeExecutor.deleteCache();
    } catch (error) {
        await promptForFailure("Failed to delete cache.", error);
    }
}
