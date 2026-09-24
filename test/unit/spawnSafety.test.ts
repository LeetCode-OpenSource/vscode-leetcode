// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import * as cp from "child_process";
import * as fse from "fs-extra";
import * as os from "os";
import * as path from "path";

/**
 * Every LeetCode CLI invocation used to spawn through a shell with arguments
 * interpolated into the command line, so a problem id, file path or test case
 * containing shell metacharacters was executed. These tests pin the shell-less
 * contract in place.
 *
 * They deliberately exercise `child_process` directly rather than cpUtils,
 * because cpUtils imports `vscode` and cannot load outside an extension host.
 */
suite("spawn safety", () => {

    const markerDir: string = path.join(os.tmpdir(), "vscode-leetcode-spawn-safety");

    setup(async () => {
        await fse.remove(markerDir);
        await fse.ensureDir(markerDir);
    });

    teardown(async () => {
        await fse.remove(markerDir);
    });

    function spawnAndWait(args: string[], options: cp.SpawnOptions): Promise<number | null> {
        return new Promise((resolve) => {
            const child: cp.ChildProcess = cp.spawn(process.execPath, args, options);
            child.stdout?.on("data", () => undefined);
            child.stderr?.on("data", () => undefined);
            child.on("close", (code: number | null) => resolve(code));
            child.on("error", () => resolve(-1));
        });
    }

    test("a shell metacharacter payload is inert when spawned without a shell", async () => {
        const marker: string = path.join(markerDir, "noshell.marker");
        const payload: string = `1"; touch ${marker}; echo "`;

        // -e '' is a no-op script; the payload rides in as a plain argv element.
        await spawnAndWait(["-e", "", payload], {});

        assert.strictEqual(
            await fse.pathExists(marker), false,
            "the payload must not be interpreted; arguments have to stay discrete argv elements",
        );
    });

    test("the same payload IS executed under shell:true, which is why it was removed", async () => {
        const marker: string = path.join(markerDir, "shell.marker");
        const payload: string = `1"; touch ${marker}; echo "`;

        await spawnAndWait(["-e", "", `"${payload}"`], { shell: true });

        assert.strictEqual(
            await fse.pathExists(marker), true,
            "this documents the original vulnerability; if it stops reproducing the other test is no longer meaningful",
        );
    });

    test("a path containing spaces survives without quoting", async () => {
        const spaced: string = path.join(markerDir, "a folder with spaces", "file.txt");
        await fse.outputFile(spaced, "ok");

        const code: number | null = await spawnAndWait(
            ["-e", "process.exit(require('fs').existsSync(process.argv[1]) ? 0 : 1)", spaced],
            {},
        );
        assert.strictEqual(code, 0, "an unquoted spaced path must reach the child intact");
    });

    test("a backtick in an argument is not evaluated", async () => {
        // Real problem 432 is titled "All O`one Data Structure", which used to
        // abort submit and test outright.
        const marker: string = path.join(markerDir, "backtick.marker");
        const payload: string = `432.All O\`touch ${marker}\`one.py`;

        await spawnAndWait(["-e", "", payload], {});

        assert.strictEqual(await fse.pathExists(marker), false, "backticks must not be evaluated");
    });
});
