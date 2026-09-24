// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

/**
 * Pure string parsers extracted from the command/webview layers.
 *
 * This module MUST NOT import `vscode` (or anything that transitively does),
 * so it can be unit tested in plain Node without an extension host.
 */

export enum ProblemState {
    AC = 1,
    NotAC = 2,
    Unknown = 3,
    Locked = 4,
}

export interface IProblemListRow {
    id: string;
    isFavorite: boolean;
    locked: boolean;
    state: ProblemState;
    name: string;
    difficulty: string;
    passRate: string;
}

export interface ISubmissionResult {
    [key: string]: string[];
    messages: string[];
}

/** Matches an SGR/ANSI escape sequence, with or without the ESC byte. */
const ANSI_PATTERN: RegExp = /\x1b?\[[0-9;]*m/g;

/**
 * The CLI colourises its output when FORCE_COLOR/CLICOLOR_FORCE is set in the
 * environment, which otherwise makes every list row unparseable.
 */
export function stripAnsi(text: string): string {
    return text.replace(ANSI_PATTERN, "");
}

/**
 * One row of `leetcode list` output, e.g.
 *   "  ✔  [  1 ] Two Sum                      Easy   (55.44 %)"
 *
 * The id group accepts any non-"]" content because leetcode.cn issues
 * non-numeric front-end ids such as "LCP 82", "LCR 194" and "LCS 03".
 */
export const LIST_LINE_REGEX: RegExp =
    /^(.)\s(.{1,2})\s(.)\s\[\s*([^\]]*?)\s*\]\s*(.*)\s*(Easy|Medium|Hard)\s*\((\s*\d+\.\d+ %)\)/;

export function parseProblemListLine(rawLine: string): IProblemListRow | undefined {
    const line: string = stripAnsi(rawLine);
    const match: RegExpMatchArray | null = line.match(LIST_LINE_REGEX);
    if (!match || match.length !== 8) {
        return undefined;
    }
    return {
        id: match[4].trim(),
        isFavorite: match[1].trim().length > 0,
        locked: match[2].trim().length > 0,
        state: parseProblemState(match[3]),
        name: match[5].trim(),
        difficulty: match[6].trim(),
        passRate: match[7].trim(),
    };
}

export function parseProblemState(stateOutput: string): ProblemState {
    if (!stateOutput) {
        return ProblemState.Unknown;
    }
    switch (stateOutput.trim()) {
        case "v":
        case "✔":
        case "√":
            return ProblemState.AC;
        case "X":
        case "✘":
        case "×":
            return ProblemState.NotAC;
        default:
            return ProblemState.Unknown;
    }
}

/**
 * The CLI reports genuine failures with a "[ERROR]" tag written at the start of
 * a line. Problem text, judge output and discussion bodies are always indented
 * by the CLI's own logger, so anchoring at line start distinguishes a real
 * error from the word "ERROR" merely appearing in content.
 */
const CLI_ERROR_REGEX: RegExp = /^\[ERROR\]/m;

export function containsCliError(output: string): boolean {
    return CLI_ERROR_REGEX.test(stripAnsi(output));
}

/**
 * Parses the human-readable output of `leetcode test` / `leetcode submit`.
 * Falls back to surfacing the raw text so a CLI failure is never swallowed.
 */
export function parseSubmissionResult(rawInput: string): ISubmissionResult {
    const raw: string = stripAnsi(rawInput).concat("  √ "); // dummy sentinel terminator
    const regSplit: RegExp = /  [√×✔✘vx] ([^]+?)\n(?=  [√×✔✘vx] )/g;
    const regKeyVal: RegExp = /(.+?): ([^]*)/;
    const result: ISubmissionResult = { messages: [] };
    let entry: RegExpExecArray | null;
    do {
        entry = regSplit.exec(raw);
        if (!entry) {
            continue;
        }
        const kvMatch: RegExpExecArray | null = regKeyVal.exec(entry[1]);
        if (kvMatch) {
            const [key, value] = kvMatch.slice(1);
            if (value) { // Do not show empty string
                if (!Object.prototype.hasOwnProperty.call(result, key) || !result[key]) {
                    result[key] = [];
                }
                result[key].push(value);
            }
        } else {
            result.messages.push(entry[1]);
        }
    } while (entry);

    if (result.messages.length === 0) {
        // Nothing matched the judge's icon format. This happens whenever the CLI
        // failed outright, and previously rendered as the literal "## undefined".
        const fallback: string = stripAnsi(rawInput).trim();
        result.messages.push(fallback.length > 0 ? fallback : "No output was returned by the LeetCode CLI.");
    }
    return result;
}

/**
 * Extracts the signed-in user name from `leetcode user` table output.
 * Returns an empty string when the CLI has no usable user, so callers can
 * treat that as signed out rather than inventing a placeholder name.
 */
export function tryParseUserName(output: string): string {
    const match: RegExpMatchArray | null = stripAnsi(output).match(/^\s*.\s*(.+?)\s*https:\/\/leetcode/m);
    if (!match || match.length !== 2) {
        return "";
    }
    const name: string = match[1].trim();
    if (!name || name === "undefined" || name === "null") {
        return "";
    }
    return name;
}
