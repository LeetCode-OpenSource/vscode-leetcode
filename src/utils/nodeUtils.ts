"use strict";

import { executeCommand } from "./cpUtils";

export namespace mavenUtils {
    const nodeCommand: string = "node";
    export async function validateMavenInstalled(): Promise<void> {
        try {
            await executeCommand(nodeCommand, ["-v"]);
        } catch (error) {
            throw new Error('Failed to find "maven" on path.');
        }
    }
}
