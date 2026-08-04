// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { getUrl } from "../shared";
import { LcAxios } from "../utils/httpUtils";

export const queryStudyPlan = async (slug: string): Promise<{ problemIds: string[] }> => {
    // leetcode.cn study plan GraphQL API is not publicly documented.
    // Instead, we fetch the study plan HTML page and parse problem IDs from SSR data.
    const url: string = `${getUrl("base")}/studyplan/${slug}/`;
    const res = await LcAxios(url, {
        method: "GET",
        responseType: "text",
        headers: {
            "content-type": "text/html",
        },
    });
    const html: string = typeof res.data === "string" ? res.data : JSON.stringify(res.data);

    // Extract questionFrontendId values from the page's embedded JSON data
    const idPattern: RegExp = /"questionFrontendId":"?(\d+)"?/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    const seen: Set<string> = new Set();
    while ((match = idPattern.exec(html)) !== null) {
        const id: string = match[1];
        if (!seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    }

    if (ids.length === 0) {
        throw new Error(`No problems found for study plan: ${slug}`);
    }

    return { problemIds: ids };
};
