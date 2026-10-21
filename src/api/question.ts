// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { graphql, IGraphQLRequest } from "./client";
import { QUESTION_DETAIL_QUERY } from "./queries";

export interface ICodeSnippet {
    lang: string;
    langSlug: string;
    code: string;
}

export interface IQuestionTag {
    name: string;
    translatedName?: string;
    slug: string;
}

export interface IQuestionDetail {
    questionId: string;
    questionFrontendId: string;
    title: string;
    translatedTitle?: string;
    titleSlug: string;
    difficulty: string;
    isPaidOnly: boolean;
    content: string;
    translatedContent?: string;
    sampleTestCase?: string;
    metaData?: string;
    codeSnippets: ICodeSnippet[];
    topicTags: IQuestionTag[];
}

interface IQuestionResponse {
    question: IQuestionDetail | null;
}

export async function fetchQuestionDetail(
    request: IGraphQLRequest,
    titleSlug: string,
): Promise<IQuestionDetail> {
    const data = await graphql<IQuestionResponse>(request, QUESTION_DETAIL_QUERY, { titleSlug });
    if (!data.question) {
        throw new Error(`Problem not found: ${titleSlug}`);
    }
    return data.question;
}
