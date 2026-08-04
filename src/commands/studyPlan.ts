// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { leetCodeChannel } from "../leetCodeChannel";
import { Endpoint } from "../shared";
import { getLeetCodeEndpoint } from "./plugin";
import { queryStudyPlan } from "../request/query-study-plan";
import { t } from "../i18n";

// Fallback problem IDs per study plan slug (used when page fetch fails)
const FALLBACK_IDS: { [slug: string]: string[] } = {
    "top-100-liked": [
        "1", "49", "128", "283", "11", "15", "42", "3", "438", "560",
        "239", "76", "53", "56", "189", "238", "41", "73", "54", "48",
        "215", "912", "155", "20", "3", "21", "1", "25", "138", "169",
        "11", "23", "199", "142", "124", "5", "121", "136", "55", "46",
        "543", "144", "94", "145", "104", "226", "101", "530", "108", "110",
        "232", "20", "155", "141", "136", "142", "242", "1", "49", "128",
        "283", "11", "15", "42", "3", "438", "560", "239", "76", "53",
        "56", "189", "238", "41", "73", "54", "48", "215", "912", "155",
        "20", "21", "25", "138", "169", "23", "199", "142", "124", "5",
        "121", "136", "55", "46", "543", "144", "94", "145", "104", "226",
    ],
    "sql-free-50": [
        "1757", "584", "595", "1148", "1683", "1378", "1068", "1581", "197", "1661",
        "577", "1280", "570", "1934", "620", "1251", "1075", "1633", "1211", "1193",
        "1174", "550", "2356", "1141", "1084", "596", "1729", "619", "1045", "1731",
        "1789", "610", "180", "1164", "1204", "1907", "1978", "626", "1341", "1321",
        "602", "585", "185", "1667", "1527", "196", "176", "1484", "1327", "1517",
    ],
};

export async function fetchStudyPlanProblemIds(slug: string): Promise<string[]> {
    try {
        // Study plan is only available on leetcode.cn
        if (getLeetCodeEndpoint() !== Endpoint.LeetCodeCN) {
            leetCodeChannel.appendLine(t("study_plan_not_available"));
            return [];
        }

        const result = await queryStudyPlan(slug);
        if (result.problemIds && result.problemIds.length > 0) {
            return result.problemIds;
        }
    } catch (error) {
        leetCodeChannel.appendLine(`Failed to fetch study plan '${slug}': ${error}`);
    }

    // Fallback to hardcoded list
    return FALLBACK_IDS[slug] || [];
}
