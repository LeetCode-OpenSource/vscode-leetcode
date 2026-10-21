// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import type { IProblem } from "../shared";
import type { IQuestionDetail } from "./question";

export interface IProblemFileOptions {
    detail: IQuestionDetail;
    problem: IProblem;
    language: string;
    includeDescription: boolean;
    useTranslation: boolean;
    endpoint: string;
}

const NAMED_ENTITIES: { [key: string]: string } = {
    amp: "&",
    apos: "'",
    gt: ">",
    ldquo: "\u201c",
    lt: "<",
    nbsp: " ",
    quot: "\"",
    rdquo: "\u201d",
    hellip: "\u2026",
    mdash: "\u2014",
    ndash: "\u2013",
};

function decodeEntities(text: string): string {
    return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (match: string, decimal?: string, hex?: string, name?: string): string => {
        if (decimal) {
            return String.fromCodePoint(Number(decimal));
        }
        if (hex) {
            return String.fromCodePoint(parseInt(hex, 16));
        }
        if (name) {
            const value: string | undefined = NAMED_ENTITIES[name.toLowerCase()];
            if (value !== undefined) {
                return value;
            }
        }
        return match;
    });
}

export function htmlToPlainText(html: string): string {
    const text: string = html
        .replace(/<\s*br\s*\/?>/gi, "\n")
        .replace(/<\s*\/p\s*>/gi, "\n\n")
        .replace(/<\s*\/div\s*>/gi, "\n")
        .replace(/<\s*li\s*>/gi, "- ")
        .replace(/<\s*\/li\s*>/gi, "\n")
        .replace(/<\s*\/h[1-6]\s*>/gi, "\n")
        .replace(/<[^>]+>/g, "");

    return decodeEntities(text)
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function commentPrefix(language: string): string {
    if (["python", "python3", "ruby", "bash"].indexOf(language) >= 0) {
        return "#";
    }
    if (language === "mysql") {
        return "--";
    }
    return "//";
}

/**
 * Builds a LeetCode problem file that keeps the `@lc` header and code markers
 * used by the CodeLens provider. The description is optional because it is
 * normally shown in the webview instead of the file.
 */
export function buildProblemFile(options: IProblemFileOptions): string {
    const detail: IQuestionDetail = options.detail;
    const prefix: string = commentPrefix(options.language);
    const title: string = options.useTranslation
        ? (detail.translatedTitle || detail.title)
        : detail.title;
    const content: string = options.useTranslation
        ? (detail.translatedContent || detail.content)
        : detail.content;
    const identifier: string = detail.questionFrontendId || options.problem.id;

    const lines: string[] = [
        `${prefix} @lc app=${options.endpoint} id=${identifier} lang=${options.language}`,
        prefix,
        `${prefix} [${identifier}] ${title}`,
    ];

    if (options.includeDescription) {
        const description: string = htmlToPlainText(content);
        if (description) {
            lines.push(prefix);
            for (const descriptionLine of description.split("\n")) {
                lines.push(descriptionLine ? `${prefix} ${descriptionLine}` : prefix);
            }
        }
    }

    const snippet: string = (detail.codeSnippets.find((item) => item.langSlug === options.language) || { code: "" }).code.trim();

    lines.push("");
    lines.push(`${prefix} @lc code=begin`);
    lines.push("");
    if (snippet) {
        lines.push(snippet);
        lines.push("");
    }
    lines.push(`${prefix} @lc code=end`);
    lines.push("");

    return lines.join("\n");
}
