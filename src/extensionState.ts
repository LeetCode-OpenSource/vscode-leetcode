import * as vscode from "vscode";

interface IExtensionState {
    context: vscode.ExtensionContext;
    cachePath: string;
}

export const extensionState: IExtensionState = {
    context: (null as any),
    cachePath: "",
};
