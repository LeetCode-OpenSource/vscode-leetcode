// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import {
    containsCliError,
    LIST_LINE_REGEX,
    parseProblemListLine,
    parseProblemState,
    parseSubmissionResult,
    ProblemState,
    stripAnsi,
    summariseCliOutput,
    tryParseUserName,
} from "../../src/utils/parseUtils";

/**
 * The regex this project shipped for two years. Kept here so each regression
 * test can demonstrate the concrete defect it fixes rather than merely
 * asserting the new behaviour.
 */
const LEGACY_LIST_REGEX: RegExp =
    /^(.)\s(.{1,2})\s(.)\s\[\s*(\d*)\s*\]\s*(.*)\s*(Easy|Medium|Hard)\s*\((\s*\d+\.\d+ %)\)/;

suite("parseUtils.parseProblemListLine", () => {

    test("parses an ordinary numeric problem row", () => {
        const row = parseProblemListLine("    ✔ [  1 ] Two Sum                                                      Easy   (55.44 %)");
        assert.ok(row, "expected the row to parse");
        assert.strictEqual(row!.id, "1");
        assert.strictEqual(row!.name, "Two Sum");
        assert.strictEqual(row!.difficulty, "Easy");
        assert.strictEqual(row!.passRate, "55.44 %");
        assert.strictEqual(row!.state, ProblemState.AC);
        assert.strictEqual(row!.locked, false);
        assert.strictEqual(row!.isFavorite, false);
    });

    test("parses a four digit id now that the catalog exceeds 3900 problems", () => {
        const row = parseProblemListLine("      [3921] Some Recent Problem                                          Hard   (12.30 %)");
        assert.ok(row);
        assert.strictEqual(row!.id, "3921");
    });

    test("marks favorite and locked columns", () => {
        const row = parseProblemListLine("★ 🔒 ✘ [ 17 ] Premium Only                                                 Medium (40.00 %)");
        assert.ok(row);
        assert.strictEqual(row!.isFavorite, true);
        assert.strictEqual(row!.locked, true);
    });

    // -- regression: leetcode.cn non-numeric front-end ids -------------------

    test("REGRESSION: parses leetcode.cn LCP / LCR / LCS ids that the legacy regex dropped", () => {
        const cnRows: Array<[string, string]> = [
            ["      [LCP 82] Tree of Spirits                                              Hard   (16.87 %)", "LCP 82"],
            ["      [LCR 194] Tree Depth                                                   Easy   (77.10 %)", "LCR 194"],
            ["      [LCS 03] Theme Space                                                  Medium (61.20 %)", "LCS 03"],
        ];

        for (const [line, expectedId] of cnRows) {
            assert.strictEqual(
                line.match(LEGACY_LIST_REGEX), null,
                `legacy regex was expected to FAIL on "${expectedId}" — this test documents the bug`,
            );
            const row = parseProblemListLine(line);
            assert.ok(row, `new parser must accept "${expectedId}"`);
            assert.strictEqual(row!.id, expectedId);
        }
    });

    // -- regression: ANSI colour --------------------------------------------

    test("REGRESSION: parses rows even when the CLI emits ANSI colour", () => {
        const esc: string = String.fromCharCode(27);
        const coloured: string =
            `    ${esc}[32m✔${esc}[39m [  1 ] Two Sum                                                      ${esc}[32mEasy${esc}[39m   (55.44 %)`;

        assert.strictEqual(
            coloured.match(LEGACY_LIST_REGEX), null,
            "legacy regex was expected to fail on coloured output - this test documents the bug",
        );
        const row = parseProblemListLine(coloured);
        assert.ok(row, "new parser must strip ANSI before matching");
        assert.strictEqual(row!.id, "1");
        assert.strictEqual(row!.difficulty, "Easy");
        assert.strictEqual(row!.state, ProblemState.AC);
    });

    test("returns undefined for a line that is not a problem row", () => {
        assert.strictEqual(parseProblemListLine(""), undefined);
        assert.strictEqual(parseProblemListLine("[ERROR] session expired, please login again"), undefined);
    });

    test("LIST_LINE_REGEX still captures exactly eight groups", () => {
        const match = "    ✔ [  1 ] Two Sum   Easy   (55.44 %)".match(LIST_LINE_REGEX);
        assert.ok(match);
        assert.strictEqual(match!.length, 8);
    });
});

suite("parseUtils.parseProblemState", () => {
    test("maps every accepted glyph", () => {
        for (const ac of ["v", "✔", "√"]) {
            assert.strictEqual(parseProblemState(ac), ProblemState.AC, `"${ac}" should be AC`);
        }
        for (const notAc of ["X", "✘", "×"]) {
            assert.strictEqual(parseProblemState(notAc), ProblemState.NotAC, `"${notAc}" should be NotAC`);
        }
    });

    test("treats blank and unrecognised glyphs as Unknown", () => {
        assert.strictEqual(parseProblemState(""), ProblemState.Unknown);
        assert.strictEqual(parseProblemState(" "), ProblemState.Unknown);
        assert.strictEqual(parseProblemState("?"), ProblemState.Unknown);
    });
});

suite("parseUtils.parseSubmissionResult", () => {

    test("parses a successful submission report", () => {
        const raw: string = [
            "  ✔ Accepted",
            "  ✔ 29/29 cases passed (52 ms)",
            "  ✔ Your runtime beats 94.61 % of javascript submissions",
            "",
        ].join("\n");

        const result = parseSubmissionResult(raw);
        assert.strictEqual(result.messages[0], "Accepted");
        assert.ok(result.messages.some((m: string) => m.indexOf("29/29 cases passed") >= 0));
    });

    test("collects key/value sections such as testcase output", () => {
        const raw: string = [
            "  ✘ Wrong Answer",
            "  ✘ Your input: [1,2,3]",
            "",
        ].join("\n");

        const result = parseSubmissionResult(raw);
        assert.ok(result["Your input"], "expected a 'Your input' section");
        assert.strictEqual(result["Your input"][0], "[1,2,3]");
    });

    // -- regression: the "## undefined" panel --------------------------------

    test("REGRESSION: surfaces raw CLI failure text instead of producing undefined", () => {
        const cliFailure: string = "[ERROR] session expired, please login again [code=-1]\n";
        const result = parseSubmissionResult(cliFailure);

        assert.notStrictEqual(
            result.messages[0], undefined,
            "messages[0] must never be undefined — that rendered as the literal '## undefined'",
        );
        assert.ok(
            result.messages[0].indexOf("session expired") >= 0,
            `expected the real CLI error to reach the user, got: ${result.messages[0]}`,
        );
    });

    test("REGRESSION: never yields undefined even for completely empty output", () => {
        const result = parseSubmissionResult("");
        assert.strictEqual(typeof result.messages[0], "string");
        assert.ok(result.messages[0].length > 0);
    });

    test("does not let a '__proto__' key corrupt the result object", () => {
        const result = parseSubmissionResult("  ✔ __proto__: polluted\n");
        assert.strictEqual(({} as any).polluted, undefined, "Object.prototype must not be touched");
        assert.ok(result);
    });
});

suite("parseUtils.tryParseUserName", () => {

    test("extracts the user name from the CLI table", () => {
        const output: string = [
            "  Premium   User                 Host",
            "  ------------------------------------------------------------",
            "    ✘      alice                https://leetcode.cn",
        ].join("\n");
        assert.strictEqual(tryParseUserName(output), "alice");
    });

    // -- regression: "signed in as undefined" --------------------------------

    test("REGRESSION: rejects the literal 'undefined' the CLI prints after a failed login", () => {
        const wedged: string = "    x      undefined            https://leetcode.cn";
        assert.strictEqual(
            tryParseUserName(wedged), "",
            "a corrupt CLI record must read as signed out, not as a user named 'undefined'",
        );
    });

    test("returns empty string when the CLI reports no user at all", () => {
        assert.strictEqual(tryParseUserName("[ERROR] You are not login yet?"), "");
        assert.strictEqual(tryParseUserName(""), "");
    });
});

suite("parseUtils.containsCliError", () => {

    test("detects a genuine CLI error tag at line start", () => {
        assert.strictEqual(containsCliError("[ERROR] session expired, please login again [code=-1]"), true);
        assert.strictEqual(containsCliError("some output\n[ERROR] failed to load locked problem!"), true);
    });

    // -- regression: false failures on ordinary content ----------------------

    test("REGRESSION: does not treat the word ERROR inside indented content as a failure", () => {
        const mysqlJudgeOutput: string = [
            "  ✘ Wrong Answer",
            "  ✘ Your input: ERROR 1054 (42S22): Unknown column 'x' in 'field list'",
            "",
        ].join("\n");
        assert.strictEqual(
            containsCliError(mysqlJudgeOutput), false,
            "indented judge output mentioning ERROR must not be reported as a CLI failure",
        );

        assert.strictEqual(
            containsCliError("  ✔ Accepted\n  ✔ A problem titled ERROR HANDLING\n"), false,
        );
    });

    test("detects the error tag even when the CLI colourises it", () => {
        assert.strictEqual(containsCliError("[31m[ERROR][39m boom"), true);
    });
});

suite("parseUtils.stripAnsi", () => {
    test("removes SGR sequences and leaves plain text untouched", () => {
        assert.strictEqual(stripAnsi("[38;2;0;255;0mEasy[39m"), "Easy");
        assert.strictEqual(stripAnsi("plain"), "plain");
    });
});

suite("parseUtils.summariseCliOutput", () => {

    test("prefers the CLI's own [ERROR] line", () => {
        const out: string = "- Waiting session result\n[ERROR] http error [code=405]\n";
        assert.strictEqual(summariseCliOutput(out).trim(), "[ERROR] http error [code=405]");
    });

    test("REGRESSION: reports a crash instead of a stack-trace tail", () => {
        const out: string = [
            "some noise",
            "TypeError: Cannot read properties of null (reading 'isCurrentUserPremium')",
            "    at Request.emit (node:events:514:20)",
            "    at Request.<anonymous> (/x/node_modules/request/request.js:1)",
        ].join("\n");
        const summary: string = summariseCliOutput(out);
        assert.ok(summary.indexOf("TypeError") >= 0, `expected the thrown error, got: ${summary}`);
        assert.strictEqual(summary.indexOf("    at "), -1, "stack frames must not be shown to the user");
    });

    test("falls back to the last meaningful line", () => {
        assert.strictEqual(summariseCliOutput("first line\nlast line").trim(), "last line");
    });

    test("returns an empty string for empty output", () => {
        assert.strictEqual(summariseCliOutput(""), "");
        assert.strictEqual(summariseCliOutput("   \n  "), "");
    });
});
