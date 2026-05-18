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

    public provideFileDecoration(uri: Uri): ProviderResult<FileDecoration>  {
        if (!this.isDifficultyBadgeEnabled()) {
            return;
        }

        if (uri.scheme !== "leetcode" && uri.authority !== "problems") {
            return;
        }

        const params: URLSearchParams = new URLSearchParams(uri.query);
        const difficulty: string = params.get("difficulty")!.toLowerCase();
        return {
            badge: this.DIFFICULTY_BADGE_LABEL[difficulty],
            color: this.ITEM_COLOR[difficulty],
        };
    }

    private isDifficultyBadgeEnabled(): boolean {
        const configuration: WorkspaceConfiguration = workspace.getConfiguration();
        return configuration.get<boolean>("leetcode.colorizeProblems", false);
    }
}

export const leetCodeTreeItemDecorationProvider: LeetCodeTreeItemDecorationProvider = new LeetCodeTreeItemDecorationProvider();
