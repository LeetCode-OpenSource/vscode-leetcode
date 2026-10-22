// Regression test for parseTestString quoting (src/commands/test.ts)
// Run: node test/verify-quoting.js

"use strict";

const cp = require("child_process");
const path = require("path");

// ---------- parseTestString (mirrors src/commands/test.ts) ----------

function parseTestString_bash(test) {
    return "'" + test.replace(/'/g, "'\\''") + "'";
}

function parseTestString_cmd(test) {
    return '"' + test.replace(/"/g, '\\"') + '"';
}

// ---------- test helpers ----------

const RECEIVER = path.join(__dirname, "quoting-receiver.js");
const RECEIVER_POSIX = RECEIVER.replace(/\\/g, "/");

function spawnTestBash(parsed) {
    return new Promise(function (resolve) {
        var cmd = "node " + JSON.stringify(RECEIVER_POSIX) + " -t " + parsed;
        var stdout = "";
        var stderr = "";
        var child = cp.spawn("bash", ["-c", cmd]);
        child.stdout.on("data", function (d) { stdout += d; });
        child.stderr.on("data", function (d) { stderr += d; });
        child.on("error", function (err) {
            resolve({ exitCode: -1, received: null, stderr: err.message });
        });
        child.on("close", function (code) {
            var received = null;
            try {
                var arr = JSON.parse(stdout);
                var idx = arr.indexOf("-t");
                if (idx >= 0) received = arr[idx + 1];
            } catch (_) { /* parse failure */ }
            resolve({ exitCode: code, received: received, stderr: stderr.trim().split("\n")[0] });
        });
    });
}

function spawnTestCmd(parsed) {
    return new Promise(function (resolve) {
        var stdout = "";
        var stderr = "";
        var child = cp.spawn("node", ['"' + RECEIVER + '"', "-t", parsed], { shell: true });
        child.stdout.on("data", function (d) { stdout += d; });
        child.stderr.on("data", function (d) { stderr += d; });
        child.on("error", function (err) {
            resolve({ exitCode: -1, received: null, stderr: err.message });
        });
        child.on("close", function (code) {
            var received = null;
            try {
                var arr = JSON.parse(stdout);
                var idx = arr.indexOf("-t");
                if (idx >= 0) received = arr[idx + 1];
            } catch (_) { /* parse failure */ }
            resolve({ exitCode: code, received: received, stderr: stderr.trim().split("\n")[0] });
        });
    });
}

var TEST_CASES = [
    { input: "[1,2,3]",           desc: "numeric array" },
    { input: '"hello"',           desc: "double quotes" },
    { input: "it's",              desc: "embedded single quote" },
    { input: "['a','b']",         desc: "array with single-quoted chars" },
    { input: "",                   desc: "empty string" },
    { input: "hello world",       desc: "spaces" },
    { input: "a\\nb",             desc: "backslash-n" },
    { input: "a;echo INJECTED",   desc: "shell metacharacters" },
    { input: 'both "and" it\'s',  desc: "single and double quotes" },
    { input: "'",                  desc: "lone single quote" },
    { input: "a'b'c'd",           desc: "multiple single quotes" },
    { input: "$HOME",             desc: "dollar variable" },
    { input: "`whoami`",          desc: "backtick command" },
];

async function runSuite(label, spawnFn, parseFn) {
    var passed = 0;
    var failed = 0;
    console.log("--- " + label + " ---");
    for (var i = 0; i < TEST_CASES.length; i++) {
        var tc = TEST_CASES[i];
        var parsed = parseFn(tc.input);
        var r = await spawnFn(parsed);
        var ok = r.received === tc.input;
        if (ok) {
            passed++;
            console.log("  PASS  " + tc.desc);
        } else {
            failed++;
            console.log("  FAIL  " + tc.desc);
            console.log("        input:    " + JSON.stringify(tc.input));
            console.log("        parsed:   " + JSON.stringify(parsed));
            console.log("        received: " + JSON.stringify(r.received));
            console.log("        exit:     " + r.exitCode);
            if (r.stderr) console.log("        stderr:   " + r.stderr);
        }
    }
    console.log("  " + passed + " passed, " + failed + " failed\n");
    return failed;
}

async function main() {
    console.log("parseTestString quoting regression test");
    console.log("Platform: " + process.platform + ", Node: " + process.version);
    console.log("Receiver: " + RECEIVER);
    console.log("");

    var totalFail = 0;

    // Bash tests
    try {
        cp.execSync("bash --version", { stdio: "ignore" });
        totalFail += await runSuite("Bash (actual shell)", spawnTestBash, parseTestString_bash);
    } catch (_) {
        console.log("--- Bash: SKIPPED (bash not available) ---\n");
    }

    // CMD tests (Windows only)
    if (process.platform === "win32") {
        totalFail += await runSuite("CMD (actual shell)", spawnTestCmd, parseTestString_cmd);
    } else {
        console.log("--- CMD: SKIPPED (not Windows) ---\n");
    }

    // PowerShell: note
    console.log("--- PowerShell: NOT TESTED ---");
    console.log("  (Requires ComSpec set to PowerShell; verify manually)\n");

    if (totalFail > 0) {
        console.log("RESULT: " + totalFail + " test(s) FAILED");
        process.exit(1);
    } else {
        console.log("RESULT: All tests passed");
    }
}

main().catch(function (e) { console.error(e); process.exit(1); });
