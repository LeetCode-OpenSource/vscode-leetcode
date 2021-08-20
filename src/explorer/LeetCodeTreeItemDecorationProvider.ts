import { URLSearchParams } from "url";
import { FileDecoration, FileDecorationProvider, ProviderResult, ThemeColor, Uri } from "vscode";

export class LeetCodeTreeItemDecorationProvider implements FileDecorationProvider {
    private readonly DIFFICULTY_BADGE_LABEL: { [key: string]: string } = {
        easy: "E",
        medium: "M",
        hard: "H",
    };

    private readonly ITEM_COLOR: { [key: string]: ThemeColor } = {
        easy: new ThemeColor("problems.difficulty.badge.easy"),
        medium: new ThemeColor("problems.difficulty.badge.medium"),
        hard: new ThemeColor("problems.difficulty.badge.hard"),
    };

    public provideFileDecoration(uri: Uri): ProviderResult<FileDecoration>  {
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
}

export const leetCodeTreeItemDecorationProvider: LeetCodeTreeItemDecorationProvider = new LeetCodeTreeItemDecorationProvider();
