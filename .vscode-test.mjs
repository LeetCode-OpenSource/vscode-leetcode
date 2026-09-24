import { defineConfig } from "@vscode/test-cli";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

/**
 * The extension wipes `~/.lc` (the leetcode-cli session directory) the first
 * time it activates in a profile. Integration tests always run in a fresh
 * profile, so without redirecting HOME they would destroy the developer's real
 * LeetCode session. Every test run gets a throwaway home instead.
 */
const sandboxHome = path.join(os.tmpdir(), "vscode-leetcode-test-home");
fs.mkdirSync(sandboxHome, { recursive: true });

export default defineConfig({
    files: "out/test/integration/*.test.js",
    version: "stable",
    mocha: {
        ui: "tdd",
        timeout: 120000,
    },
    launchArgs: ["--disable-extensions"],
    env: {
        HOME: sandboxHome,
        USERPROFILE: sandboxHome,
        VSCODE_LEETCODE_TEST_HOME: sandboxHome,
    },
});
