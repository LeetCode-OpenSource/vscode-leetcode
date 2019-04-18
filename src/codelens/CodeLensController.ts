// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { ConfigurationChangeEvent, Disposable, languages, workspace, WorkspaceConfiguration } from "vscode";
import { CustomCodeLensProvider } from "./CustomCodeLensProvider";

class CodeLensController implements Disposable {
    private internalProvider: CustomCodeLensProvider;
    private registeredProvider: Disposable | undefined;
    private configurationChangeListener: Disposable;

    constructor() {
        this.internalProvider = new CustomCodeLensProvider();

        this.configurationChangeListener = workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration("leetcode.enableShortcuts")) {
                this.setCodeLensVisibility();
            }
        }, this);

        this.setCodeLensVisibility();
    }

    public dispose(): void {
        if (this.registeredProvider) {
            this.registeredProvider.dispose();
        }
        this.configurationChangeListener.dispose();
    }

    private setCodeLensVisibility(): void {
        if (this.isShortcutsEnabled() && !this.registeredProvider) {
            this.registeredProvider = languages.registerCodeLensProvider({ scheme: "file" }, this.internalProvider);
        } else if (!this.isShortcutsEnabled() && this.registeredProvider) {
            this.registeredProvider.dispose();
            this.registeredProvider = undefined;
        }
    }

    private isShortcutsEnabled(): boolean {
        const configuration: WorkspaceConfiguration = workspace.getConfiguration();
        return configuration.get<boolean>("leetcode.enableShortcuts", true);
    }
}

export const codeLensController: CodeLensController = new CodeLensController();
