// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { IProblem, ProblemState } from "../shared";

export interface ITopicTag {
    name: string;
    nameTranslated?: string;
    slug: string;
}

export interface ICompanyTag {
    slug?: string;
    name?: string;
}

export interface IQuestionNode {
    frontendQuestionId: string;
    title?: string;
    titleCn?: string;
    titleSlug?: string;
    difficulty?: string;
    paidOnly?: boolean;
    acRate?: number;
    status?: string;
    isFavor?: boolean;
    topicTags?: ITopicTag[];
    extra?: {
        topCompanyTags?: ICompanyTag[];
    };
}

export interface IQuestionListPage {
    total: number;
    questions: IQuestionNode[];
}

function normalizeDifficulty(difficulty: string | undefined): string {
    const value: string = (difficulty || "").trim();
    switch (value.toLowerCase()) {
        case "easy":
            return "Easy";
        case "medium":
            return "Medium";
        case "hard":
            return "Hard";
        default:
            return value || "Unknown";
    }
}

function mapProblemState(status: string | undefined): ProblemState {
    switch ((status || "").toUpperCase()) {
        case "AC":
        case "SOLVED":
            return ProblemState.AC;
        case "TRIED":
        case "ATTEMPTED":
        case "NOT_AC":
            return ProblemState.NotAC;
        default:
            return ProblemState.Unknown;
    }
}

function formatPassRate(acRate: number | undefined): string {
    const rate: number = Number(acRate);
    if (!Number.isFinite(rate)) {
        return "";
    }
    return `${(rate * 100).toFixed(1)} %`;
}

export function mapQuestion(question: IQuestionNode, useTranslation: boolean): IProblem {
    const companies: string[] = (question.extra?.topCompanyTags || [])
        .map((tag: ICompanyTag) => tag.slug || tag.name || "")
        .filter((value: string) => Boolean(value));
    const tags: string[] = (question.topicTags || [])
        .map((tag: ITopicTag) => useTranslation ? (tag.nameTranslated || tag.name) : tag.name)
        .filter((value: string) => Boolean(value));

    const id: string = String(question.frontendQuestionId || "").trim();
    const slug: string = question.titleSlug || id;
    const name: string = useTranslation
        ? (question.titleCn || question.title || slug)
        : (question.title || question.titleCn || slug);

    return {
        id,
        slug,
        name,
        difficulty: normalizeDifficulty(question.difficulty),
        passRate: formatPassRate(question.acRate),
        state: mapProblemState(question.status),
        locked: Boolean(question.paidOnly),
        isFavorite: Boolean(question.isFavor),
        companies,
        tags,
    };
}
