import * as hljs from "highlight.js";
import * as MarkdownIt from "markdown-it";
import * as path from "path";
import * as vscode from "vscode";
import { leetCodeChannel } from "../leetCodeChannel";

export class MarkdownEngine {

    public readonly engine: MarkdownIt;
    public readonly extRoot: string; // root path of vscode built-in markdown extension

    public constructor() {
        this.engine = this.initEngine();
        this.extRoot = path.join(vscode.env.appRoot, "extensions", "markdown-language-features");
    }

    public get localResourceRoots(): vscode.Uri[] {
        return [vscode.Uri.file(path.join(this.extRoot, "media"))];
    }

    public get styles(): vscode.Uri[] {
        try {
            const stylePaths: string[] = require(path.join(this.extRoot, "package.json"))["contributes"]["markdown.previewStyles"];
            return stylePaths.map((p: string) => vscode.Uri.file(path.join(this.extRoot, p)).with({ scheme: "vscode-resource" }));
        } catch (error) {
            leetCodeChannel.appendLine("[Error] Fail to load built-in markdown style file.");
            return [];
        }
    }

    public get options(): MarkdownIt.Options {
        return (this.engine as any).options;
    }

    public getStylesHTML(): string {
        return this.styles.map((style: vscode.Uri) => `<link rel="stylesheet" type="text/css" href="${style.toString()}">`).join("\n");
    }

    public render(md: string, env?: any): string {
        return this.engine.render(md, env);
    }

    private initEngine(): MarkdownIt {
        const md: MarkdownIt = new MarkdownIt({
            linkify: true,
            typographer: true,
            highlight: (code: string, lang?: string): string => {
                if (lang && ["tsx", "typescriptreact"].indexOf(lang.toLocaleLowerCase()) >= 0) {
                    lang = "jsx";
                }
                if (lang && lang.toLocaleLowerCase() === "python3") {
                    lang = "python";
                }
                if (lang && lang.toLocaleLowerCase() === "c#") {
                    lang = "cs";
                }
                if (lang && lang.toLocaleLowerCase() === "json5") {
                    lang = "json";
                }
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(lang, code, true).value;
                    } catch (error) { /* do not highlight */ }
                }
                return ""; // use external default escaping
            },
        });

        this.addCodeBlockHighlight(md);
        this.addLinkValidator(md);
        return md;
    }

    private addCodeBlockHighlight(md: MarkdownIt): void {
        const origin: MarkdownIt.TokenRender = md.renderer.rules["code_block"];
        // tslint:disable-next-line:typedef
        md.renderer.rules["code_block"] = (tokens, idx, options, env, self) => {
            // if any token uses lang-specified code fence, then do not highlight code block
            if (tokens.some((token: any) => token.type === "fence")) {
                return origin(tokens, idx, options, env, self);
            }
            // otherwise, highlight with undefined lang, which could be handled in outside logic.
            const highlighted: string = options.highlight(tokens[idx].content, undefined);
            return [
                `<pre><code ${self.renderAttrs(tokens[idx])} >`,
                highlighted || md.utils.escapeHtml(tokens[idx].content),
                "</code></pre>",
            ].join("\n");
        };
    }

    private addLinkValidator(md: MarkdownIt): void {
        const validateLink: (link: string) => boolean = md.validateLink;
        md.validateLink = (link: string): boolean => {
            // support file:// protocal link
            return validateLink(link) || link.startsWith("file:");
        };
    }
}
