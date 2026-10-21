// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { globalState } from "../globalState";
import { getUrl, IProblem } from "../shared";
import { shouldUseEndpointTranslation } from "../utils/settingUtils";
import { graphql, IGraphQLRequest } from "./client";
import { IQuestionListPage, IQuestionNode, mapQuestion } from "./problemMapper";
import { PROBLEM_LIST_QUERY } from "./queries";

const PAGE_SIZE = 100;
const PAGE_CONCURRENCY = 4;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 400;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface IProblemListResponse {
    problemsetQuestionList: IQuestionListPage;
}

let cachedProblems: IProblem[] | undefined;
let cachedAt: number = 0;
let cachedKey: string | undefined;
let pendingProblems: Promise<IProblem[]> | undefined;
let pendingKey: string | undefined;
let requestId: number = 0;

function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, ms);
    });
}

async function fetchPage(skip: number, attempt: number = 0): Promise<IQuestionListPage> {
    const endpoint: string = getUrl("graphql");
    const request: IGraphQLRequest = {
        endpoint,
        origin: endpoint.replace(/\/graphql\/?$/, ""),
        cookie: globalState.getCookie() || "",
    };

    try {
        const data = await graphql<IProblemListResponse>(request, PROBLEM_LIST_QUERY, {
            categorySlug: "",
            limit: PAGE_SIZE,
            skip,
            filters: {},
        });
        return data.problemsetQuestionList;
    } catch (error) {
        if (attempt >= MAX_RETRIES) {
            throw error;
        }
        await delay(RETRY_DELAY_MS * (attempt + 1));
        return fetchPage(skip, attempt + 1);
    }
}

async function loadAllProblems(): Promise<IProblem[]> {
    const useTranslation: boolean = shouldUseEndpointTranslation();
    const firstPage: IQuestionListPage = await fetchPage(0);
    const pages: IQuestionListPage[] = [firstPage];

    const skips: number[] = [];
    for (let skip: number = PAGE_SIZE; skip < firstPage.total; skip += PAGE_SIZE) {
        skips.push(skip);
    }

    for (let index: number = 0; index < skips.length; index += PAGE_CONCURRENCY) {
        const batch: number[] = skips.slice(index, index + PAGE_CONCURRENCY);
        const results: IQuestionListPage[] = await Promise.all(
            batch.map((skip: number) => fetchPage(skip)),
        );
        pages.push(...results);
    }

    const seen: Set<string> = new Set<string>();
    const problems: IProblem[] = [];
    for (const page of pages) {
        for (const question of page.questions) {
            const problem: IProblem = mapQuestion(question as IQuestionNode, useTranslation);
            if (!problem.id || seen.has(problem.id)) {
                continue;
            }
            seen.add(problem.id);
            problems.push(problem);
        }
    }
    return problems;
}

/**
 * Clears the cached problem list, for example after signing in as a different
 * account or switching endpoints.
 */
export function invalidateProblemCache(): void {
    cachedProblems = undefined;
    cachedAt = 0;
    cachedKey = undefined;
    pendingProblems = undefined;
    pendingKey = undefined;
    requestId += 1;
}

/**
 * Updates the cached favorite flag after a star/unstar action so the tree can
 * refresh without re-downloading all pages.
 */
export function updateCachedFavorite(id: string, isFavorite: boolean): void {
    const problem: IProblem | undefined = cachedProblems?.find((item: IProblem) => item.id === id);
    if (problem) {
        problem.isFavorite = isFavorite;
    }
}

/**
 * Returns the full problem list for the active endpoint. Results are cached for
 * a few minutes; pass forceRefresh to bypass the cache after an explicit user
 * refresh.
 */
export async function getProblems(forceRefresh: boolean = false): Promise<IProblem[]> {
    const key: string = `${getUrl("graphql")}:${shouldUseEndpointTranslation()}`;
    if (!forceRefresh && cachedProblems && cachedKey === key && Date.now() - cachedAt < CACHE_TTL_MS) {
        return cachedProblems;
    }

    if (!pendingProblems || pendingKey !== key) {
        const currentRequest: number = ++requestId;
        pendingKey = key;
        pendingProblems = loadAllProblems()
            .then((problems: IProblem[]) => {
                if (currentRequest === requestId) {
                    cachedProblems = problems;
                    cachedAt = Date.now();
                    cachedKey = key;
                }
                return problems;
            })
            .finally(() => {
                if (currentRequest === requestId) {
                    pendingProblems = undefined;
                    pendingKey = undefined;
                }
            });
    }

    return pendingProblems;
}
