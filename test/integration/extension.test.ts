// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as assert from "assert";
import * as os from "os";
import * as vscode from "vscode";

const EXTENSION_ID: string = "LeetCode.vscode-leetcode";

/**
 * Every command the manifest contributes. Kept as a literal list so that adding
 * or renaming a command without updating activation events fails loudly here.
 */
const EXPECTED_COMMANDS: string[] = [
    "leetcode.deleteCache",
    "leetcode.signin",
    "leetcode.signout",
    "leetcode.manageSessions",
    "leetcode.refreshExplorer",
    "leetcode.pickOne",
    "leetcode.showProblem",
    "leetcode.previewProblem",
    "leetcode.searchProblem",
    "leetcode.showSolution",
    "leetcode.testSolution",
    "leetcode.submitSolution",
    "leetcode.addFavorite",
    "leetcode.removeFavorite",
    "leetcode.switchDefaultLanguage",
    "leetcode.problems.sort",
];

suite("Test sandbox", () => {
    test("HOME is redirected away from the developer's real home", () => {
        const sandbox: string | undefined = process.env.VSCODE_LEETCODE_TEST_HOME;
        assert.ok(sandbox, "VSCODE_LEETCODE_TEST_HOME must be set by .vscode-test.mjs");
        assert.strictEqual(
            os.homedir(), sandbox,
            "the extension host must run with a throwaway HOME, or activation would wipe the real ~/.lc",
        );
    });
});

suite("Extension activation", () => {

    test("the extension is installed and resolves", () => {
        const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext, `${EXTENSION_ID} was not found in the test instance`);
    });

    test("activation completes without throwing", async () => {
        const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext);
        await ext!.activate();
        assert.strictEqual(ext!.isActive, true, "extension failed to reach the active state");
    });

    test("every contributed command is registered after activation", async () => {
        const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension(EXTENSION_ID);
        await ext!.activate();

        const registered: string[] = await vscode.commands.getCommands(true);
        const missing: string[] = EXPECTED_COMMANDS.filter((c: string) => registered.indexOf(c) === -1);
        assert.deepStrictEqual(missing, [], `these commands are contributed but not registered: ${missing.join(", ")}`);
    });

    test("the removed leetcode.com endpoint toggle is gone", async () => {
        const registered: string[] = await vscode.commands.getCommands(true);
        assert.strictEqual(
            registered.indexOf("leetcode.toggleLeetCodeCn"), -1,
            "this build targets leetcode.cn only, so the endpoint toggle must not exist",
        );
    });
});

suite("Manifest contract", () => {

    test("every contributed command has an activation event", () => {
        const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext);
        const pkg: any = ext!.packageJSON;
        const contributed: string[] = pkg.contributes.commands.map((c: any) => c.command);
        const events: string[] = pkg.activationEvents;

        const missing: string[] = contributed.filter((c: string) => events.indexOf(`onCommand:${c}`) === -1);
        assert.deepStrictEqual(
            missing, [],
            `contributed without an activation event, so they no-op in a cold editor: ${missing.join(", ")}`,
        );
    });

    test("onUri is declared so browser sign-in can activate the extension", () => {
        const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(ext!.packageJSON.activationEvents.indexOf("onUri") >= 0);
    });

    test("the leetcode.endpoint setting is gone", () => {
        const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension(EXTENSION_ID);
        const props: any = ext!.packageJSON.contributes.configuration[0].properties;
        assert.strictEqual(props["leetcode.endpoint"], undefined);
    });
});

suite("Tree view", () => {

    test("the explorer view is contributed", () => {
        const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension(EXTENSION_ID);
        const views: any = ext!.packageJSON.contributes.views;
        const ids: string[] = views.leetcode.map((v: any) => v.id);
        assert.ok(ids.indexOf("leetCodeExplorer") >= 0);
    });

    test("configuration defaults load", () => {
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("leetcode");
        assert.strictEqual(config.get<boolean>("hideSolved"), false);
        assert.strictEqual(config.get<boolean>("enableStatusBar"), true);
        assert.deepStrictEqual(config.get<string[]>("editor.shortcuts"), ["submit", "test"]);
    });
});
