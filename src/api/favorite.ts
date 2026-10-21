// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import axios from "axios";
import { graphql, IGraphQLRequest } from "./client";

interface IFavoriteEntry {
    name: string;
    id_hash: string;
}

interface IFavoriteListResponse {
    favorites?: {
        private_favorites?: IFavoriteEntry[];
    };
}

interface IFavoriteMutationResult {
    ok: boolean;
    error?: string;
}

export interface IFavoriteTarget {
    slug: string;
    questionId: string;
}

async function getFavoriteHash(request: IGraphQLRequest): Promise<string> {
    if (!request.cookie) {
        throw new Error("Not signed in. Please sign in to LeetCode first.");
    }

    const response = await axios.get<IFavoriteListResponse>(`${request.origin}/list/api/questions`, {
        timeout: 20000,
        headers: {
            "cookie": request.cookie,
            "origin": request.origin,
            "referer": `${request.origin}/problemset/`,
            "x-requested-with": "XMLHttpRequest",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) vscode-leetcode/0.19",
        },
    });

    const favorites: IFavoriteEntry[] = response.data?.favorites?.private_favorites || [];
    const favorite: IFavoriteEntry | undefined = favorites.find((item: IFavoriteEntry) => item.name === "Favorite") || favorites[0];
    if (!favorite || !favorite.id_hash) {
        throw new Error("LeetCode did not return a favorite list.");
    }
    return favorite.id_hash;
}

export async function setFavorite(
    request: IGraphQLRequest,
    target: IFavoriteTarget,
    favorite: boolean,
): Promise<void> {
    const favoriteIdHash: string = await getFavoriteHash(request);
    const operation: string = favorite ? "addQuestionToFavorite" : "removeQuestionFromFavorite";
    const mutation: string = `
mutation ${operation}($favoriteIdHash: String!, $questionId: String!) {
  ${operation}(favoriteIdHash: $favoriteIdHash, questionId: $questionId) {
    ok
    error
  }
}`;

    const data = await graphql<{ [key: string]: IFavoriteMutationResult }>(request, mutation, {
        favoriteIdHash,
        questionId: target.questionId,
    });
    const result: IFavoriteMutationResult | undefined = data[operation];
    if (!result || !result.ok) {
        throw new Error(result?.error || "LeetCode rejected the favorite update.");
    }
}
