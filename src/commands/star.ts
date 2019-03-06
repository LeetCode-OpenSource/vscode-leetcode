// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { LeetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { IProblem } from "../shared";
import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";

export async function starProblem(provider: LeetCodeTreeDataProvider, node: LeetCodeNode): Promise<void> {
    try {
        const problem: IProblem = Object.assign({}, node.nodeData, {
            isFavorite: await leetCodeExecutor.starProblem(node, !node.isFavorite),
        });
        provider.updateProblem(problem);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to star the problem. Please open the output channel for details.", DialogType.error);
    }
}
