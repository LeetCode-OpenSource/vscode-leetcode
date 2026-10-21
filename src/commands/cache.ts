// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { invalidateProblemCache } from "../api/problems";

export async function deleteCache(): Promise<void> {
    invalidateProblemCache();
}
