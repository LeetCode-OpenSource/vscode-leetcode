// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import axios from "axios";

export interface IGraphQLRequest {
    endpoint: string;
    origin: string;
    cookie?: string;
}

interface IGraphQLResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
}

/**
 * Minimal GraphQL client for a LeetCode endpoint. The caller supplies the
 * cookie explicitly so this module stays independent of VS Code APIs and can be
 * exercised outside the extension host.
 */
export async function graphql<T>(
    request: IGraphQLRequest,
    query: string,
    variables: { [key: string]: unknown } = {},
): Promise<T> {
    if (!request.endpoint) {
        throw new Error("LeetCode endpoint is not configured.");
    }

    const csrfMatch: RegExpMatchArray | null = request.cookie
        ? request.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
        : null;

    const response = await axios.post<IGraphQLResponse<T>>(
        request.endpoint,
        { query, variables },
        {
            timeout: 20000,
            headers: {
                ...(request.cookie ? { cookie: request.cookie } : {}),
                ...(csrfMatch ? { "x-csrftoken": csrfMatch[1], "x-requested-with": "XMLHttpRequest" } : {}),
                "origin": request.origin,
                "referer": `${request.origin}/problemset/`,
                "content-type": "application/json",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) vscode-leetcode/0.19",
            },
        },
    );

    const body = response.data;
    if (body?.errors && body.errors.length > 0) {
        throw new Error(body.errors.map((error) => error.message).join("; "));
    }
    if (!body?.data) {
        throw new Error("LeetCode returned an empty GraphQL response.");
    }
    return body.data;
}
