import { URLSearchParams } from "url";
import { FileDecoration, FileDecorationProvider, ProviderResult, ThemeColor, Uri, workspace, WorkspaceConfiguration } from "vscode";

export class LeetCodeTreeItemDecorationProvider implements FileDecorationProvider {
    private readonly DIFFICULTY_BADGE_LABEL: { [key: string]: string } = {
        easy: "E",
        medium: "M",
        hard: "H",
    };

    private readonly ITEM_COLOR: { [key: string]: ThemeColor } = {
        easy: new ThemeColor("charts.green"),
        medium: new ThemeColor("charts.yellow"),
        hard: new ThemeColor("charts.red"),
    };

    public provideFileDecoration(uri: Uri): ProviderResult<FileDecoration> {

        if (uri.scheme !== "leetcode" && uri.authority !== "problems") {
            return;
        }

        const params: URLSearchParams = new URLSearchParams(uri.query);
        const difficulty: string = params.get("difficulty")!.toLowerCase();

        var decoration = {}
        if (this.isDifficultyColorizationEnabled()) {
            decoration["color"] = this.ITEM_COLOR[difficulty]
        }
        if (this.isDifficultyBadgeEnabled()) {
            decoration["badge"] = this.DIFFICULTY_BADGE_LABEL[difficulty]
        }

        return decoration;
    }

    private isDifficultyColorizationEnabled(): boolean {
        const configuration: WorkspaceConfiguration = workspace.getConfiguration();
        return configuration.get<boolean>("leetcode.explorerTree.colorize", false);
    }

    private isDifficultyBadgeEnabled(): boolean {
        const configuration: WorkspaceConfiguration = workspace.getConfiguration();
        return configuration.get<boolean>("leetcode.explorerTree.showDifficultyBadge", false);
    }
}

export const leetCodeTreeItemDecorationProvider: LeetCodeTreeItemDecorationProvider = new LeetCodeTreeItemDecorationProvider();
