// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as hljs from "highlight.js";
import * as MarkdownIt from "markdown-it";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { leetCodeChannel } from "../leetCodeChannel";

export class MarkdownEngine {

    private readonly engine: MarkdownIt;
    private readonly extRoot: string; // root path of vscode built-in markdown extension

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

    public getStylesHTML(): string {
        return this.styles.map((style: vscode.Uri) => `<link rel="stylesheet" type="text/css" href="${style.toString()}">`).join(os.EOL);
    }

    public render(md: string, env?: any): string {
        return this.engine.render(md, env);
    }

    private initEngine(): MarkdownIt {
        const md: MarkdownIt = new MarkdownIt({
            linkify: true,
            typographer: true,
            highlight: (code: string, lang?: string): string => {
                switch (lang && lang.toLowerCase()) {
                    case "mysql":
                        lang = "sql"; break;
                    case "json5":
                        lang = "json"; break;
                    case "python3":
                        lang = "python"; break;
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
        this.addImageUrlCompletion(md);
        this.addLinkValidator(md);
        return md;
    }

    private addCodeBlockHighlight(md: MarkdownIt): void {
        const codeBlock: MarkdownIt.TokenRender = md.renderer.rules["code_block"];
        // tslint:disable-next-line:typedef
        md.renderer.rules["code_block"] = (tokens, idx, options, env, self) => {
            // if any token uses lang-specified code fence, then do not highlight code block
            if (tokens.some((token: any) => token.type === "fence")) {
                return codeBlock(tokens, idx, options, env, self);
            }
            // otherwise, highlight with default lang in env object.
            const highlighted: string = options.highlight(tokens[idx].content, env.lang);
            return [
                `<pre><code ${self.renderAttrs(tokens[idx])} >`,
                highlighted || md.utils.escapeHtml(tokens[idx].content),
                "</code></pre>",
            ].join(os.EOL);
        };
    }

    private addImageUrlCompletion(md: MarkdownIt): void {
        const image: MarkdownIt.TokenRender = md.renderer.rules["image"];
        // tslint:disable-next-line:typedef
        md.renderer.rules["image"] = (tokens, idx, options, env, self) => {
            const imageSrc: string[] | undefined = tokens[idx].attrs.find((value: string[]) => value[0] === "src");
            if (env.host && imageSrc && imageSrc[1].startsWith("/")) {
                imageSrc[1] = `${env.host}${imageSrc[1]}`;
            }
            return image(tokens, idx, options, env, self);
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
