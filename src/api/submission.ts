// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import axios from "axios";
import { IGraphQLRequest } from "./client";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 90000;

export interface IProblemSubmissionTarget {
    slug: string;
    questionId: string;
}

export interface ISubmissionResult {
    state: string;
    statusMessage: string;
    runtime?: string;
    memory?: string;
    totalCorrect?: number;
    totalTestcases?: number;
    compileError?: string;
    runtimeError?: string;
    codeOutput?: string;
    expectedOutput?: string;
    lastTestcase?: string;
}

interface ICheckResponse {
    state?: string;
    status_msg?: string;
    runtime?: string | number;
    memory?: string | number;
    total_correct?: number;
    total_testcases?: number;
    full_compile_error?: string;
    full_runtime_error?: string;
    code_output?: string | string[];
    expected_output?: string | string[];
    last_testcase?: string;
}

interface ISubmitResponse {
    submission_id?: string | number;
}

interface ITestResponse {
    interpret_id?: string | number;
}

function getCsrfToken(cookie: string | undefined): string {
    const match: RegExpMatchArray | null = (cookie || "").match(/(?:^|;\s*)csrftoken=([^;]+)/);
    if (!match) {
        throw new Error("The cookie does not contain csrftoken.");
    }
    return match[1];
}

function getHeaders(request: IGraphQLRequest, slug: string): { [key: string]: string } {
    if (!request.cookie) {
        throw new Error("Not signed in. Please sign in to LeetCode first.");
    }
    return {
        "cookie": request.cookie,
        "x-csrftoken": getCsrfToken(request.cookie),
        "x-requested-with": "XMLHttpRequest",
        "origin": request.origin,
        "referer": `${request.origin}/problems/${slug}/`,
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) vscode-leetcode/0.19",
    };
}

function toStringValue(value: string | string[] | undefined): string | undefined {
    if (value === undefined) {
        return undefined;
    }
    return Array.isArray(value) ? value.join("\n") : value;
}

function formatRuntime(value: string | number | undefined): string | undefined {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    const text: string = String(value);
    return /ms$/i.test(text) ? text : `${text} ms`;
}

function formatMemory(value: string | number | undefined): string | undefined {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    const text: string = String(value);
    if (/mb$/i.test(text)) {
        return text;
    }
    const bytes: number = Number(value);
    if (!Number.isFinite(bytes)) {
        return text;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapResult(data: ICheckResponse): ISubmissionResult {
    return {
        state: data.state || "UNKNOWN",
        statusMessage: data.status_msg || data.state || "Unknown result",
        runtime: formatRuntime(data.runtime),
        memory: formatMemory(data.memory),
        totalCorrect: data.total_correct,
        totalTestcases: data.total_testcases,
        compileError: data.full_compile_error || undefined,
        runtimeError: data.full_runtime_error || undefined,
        codeOutput: toStringValue(data.code_output),
        expectedOutput: toStringValue(data.expected_output),
        lastTestcase: data.last_testcase,
    };
}

function delay(ms: number): Promise<void> {
    return new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, ms);
    });
}

async function pollResult(request: IGraphQLRequest, checkId: string, slug: string): Promise<ISubmissionResult> {
    const headers: { [key: string]: string } = getHeaders(request, slug);
    const startedAt: number = Date.now();
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        const response = await axios.get<ICheckResponse>(
            `${request.origin}/submissions/detail/${checkId}/check/`,
            { headers, timeout: 15000 },
        );
        const state: string = response.data.state || "";
        if (state && state !== "PENDING" && state !== "STARTED") {
            return mapResult(response.data);
        }
        await delay(POLL_INTERVAL_MS);
    }
    throw new Error("Timed out while waiting for the judge result.");
}

async function postJson(
    request: IGraphQLRequest,
    slug: string,
    path: string,
    body: { [key: string]: string | number | boolean },
): Promise<{ [key: string]: unknown }> {
    const headers: { [key: string]: string } = getHeaders(request, slug);
    for (let attempt: number = 0; attempt < 3; attempt += 1) {
        try {
            const response = await axios.post<{ [key: string]: unknown }>(
                `${request.origin}${path}`,
                body,
                { headers, timeout: 20000 },
            );
            const data: { [key: string]: unknown } = response.data;
            const bodyError: string = typeof data.error === "string" ? data.error : "";
            if (bodyError) {
                if (bodyError.includes("too soon")) {
                    await delay(2000 * (attempt + 1));
                    continue;
                }
                throw new Error(bodyError);
            }
            return data;
        } catch (error) {
            const data: { error?: string } | undefined = error?.response?.data;
            const message: string = data?.error || "";
            if (message.includes("too soon")) {
                await delay(2000 * (attempt + 1));
                continue;
            }
            throw error;
        }
    }
    throw new Error("LeetCode is rate limiting test runs. Please try again shortly.");
}

export async function submitSolution(
    request: IGraphQLRequest,
    target: IProblemSubmissionTarget,
    language: string,
    code: string,
): Promise<ISubmissionResult> {
    const data = await postJson(request, target.slug, `/problems/${target.slug}/submit/`, {
        lang: language,
        question_id: Number(target.questionId),
        test_mode: false,
        typed_code: code,
        judge_type: "large",
    });
    const submissionId: unknown = (data as ISubmitResponse).submission_id;
    if (submissionId === undefined || submissionId === null) {
        throw new Error("LeetCode did not return a submission id.");
    }
    return pollResult(request, String(submissionId), target.slug);
}

export async function testSolution(
    request: IGraphQLRequest,
    target: IProblemSubmissionTarget,
    language: string,
    code: string,
    testInput: string,
): Promise<ISubmissionResult> {
    const data = await postJson(request, target.slug, `/problems/${target.slug}/interpret_solution/`, {
        lang: language,
        question_id: Number(target.questionId),
        test_mode: false,
        typed_code: code,
        data_input: testInput,
    });
    const interpretId: unknown = (data as ITestResponse).interpret_id;
    if (interpretId === undefined || interpretId === null) {
        throw new Error("LeetCode did not return an interpret id.");
    }
    return pollResult(request, String(interpretId), target.slug);
}
