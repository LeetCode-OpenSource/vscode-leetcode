import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { IProblem } from "../../src/shared";
import { buildProblemFile, htmlToPlainText } from "../../src/api/problemFile";
import type { IQuestionDetail } from "../../src/api/question";

const problem: IProblem = {
    id: "1",
    slug: "two-sum",
    name: "Two Sum",
    difficulty: "Easy",
    passRate: "50.0 %",
    state: 1 as IProblem["state"],
    locked: false,
    isFavorite: false,
    companies: [],
    tags: [],
};

const detail: IQuestionDetail = {
    questionId: "1",
    questionFrontendId: "1",
    title: "Two Sum",
    translatedTitle: "Two Sum",
    titleSlug: "two-sum",
    difficulty: "Easy",
    isPaidOnly: false,
    content: "<p>Find two numbers.</p>",
    translatedContent: "<p>Find two numbers.</p>",
    codeSnippets: [{ lang: "C++", langSlug: "cpp", code: "class Solution {};" }],
    topicTags: [],
};

test("buildProblemFile keeps the @lc contract", () => {
    const file = buildProblemFile({
        detail,
        problem,
        language: "cpp",
        includeDescription: true,
        useTranslation: true,
        endpoint: "leetcode.cn",
    });

    assert.match(file, /^\/\/ @lc app=leetcode\.cn id=1 lang=cpp/m);
    assert.match(file, /^\/\/ @lc code=begin$/m);
    assert.match(file, /^\/\/ @lc code=end$/m);
    assert.match(file, /class Solution \{\};/);
    assert.match(file, /Find two numbers\./);
    assert.doesNotMatch(file, /<p>/);
});

test("buildProblemFile uses comment syntax per language", () => {
    const python = buildProblemFile({
        detail: { ...detail, codeSnippets: [{ lang: "Python3", langSlug: "python3", code: "class Solution:" }] },
        problem,
        language: "python3",
        includeDescription: false,
        useTranslation: true,
        endpoint: "leetcode.cn",
    });
    assert.match(python, /^# @lc app=leetcode\.cn id=1 lang=python3/m);
    assert.match(python, /^# @lc code=begin$/m);
});

test("htmlToPlainText decodes entities", () => {
    assert.equal(htmlToPlainText("<p>a &amp; b</p>"), "a & b");
});
