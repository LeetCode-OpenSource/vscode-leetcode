// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as list from "../commands/list";
import { leetCodeChannel } from "../leetCodeChannel";
import { leetCodeManager } from "../leetCodeManager";
import { Category, defaultProblem, IProblem, ProblemState } from "../shared";
import { getWorkspaceConfiguration } from "../utils/workspaceUtils";
import { LeetCodeNode } from "./LeetCodeNode";

export class LeetCodeTreeDataProvider implements vscode.TreeDataProvider<LeetCodeNode> {

    private treeData: {
        Difficulty: Map<string, IProblem[]>,
        Tag: Map<string, IProblem[]>,
        Company: Map<string, IProblem[]>,
        Favorite: IProblem[],
    };

    private onDidChangeTreeDataEvent: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    // tslint:disable-next-line:member-ordering
    public readonly onDidChangeTreeData: vscode.Event<any> = this.onDidChangeTreeDataEvent.event;

    constructor(private context: vscode.ExtensionContext) { }

    public async refresh(): Promise<void> {
        await this.getProblemData();
        this.onDidChangeTreeDataEvent.fire();
    }

    public getTreeItem(element: LeetCodeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.id === "notSignIn") {
            return {
                label: element.name,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "leetcode.signin",
                    title: "Sign in to LeetCode",
                },
            };
        }

        const idPrefix: number = Date.now();
        return {
            label: element.isProblem ? `[${element.id}] ${element.name}` : element.name,
            tooltip: this.getSubCategoryTooltip(element),
            id: `${idPrefix}.${element.parentName}.${element.id}`,
            collapsibleState: element.isProblem ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: element.isProblem ? "problem" : element.id.toLowerCase(),
            iconPath: this.parseIconPathFromProblemState(element),
        };
    }

    public getChildren(element?: LeetCodeNode | undefined): vscode.ProviderResult<LeetCodeNode[]> {
        if (!leetCodeManager.getUser()) {
            return [
                new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: "notSignIn",
                    name: "Sign in to LeetCode",
                }), "ROOT", false),
            ];
        }
        if (!element) { // Root view
            return [
                new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: Category.Difficulty,
                    name: Category.Difficulty,
                }), "ROOT", false),
                new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: Category.Tag,
                    name: Category.Tag,
                }), "ROOT", false),
                new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: Category.Company,
                    name: Category.Company,
                }), "ROOT", false),
                new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: Category.Favorite,
                    name: Category.Favorite,
                }), "ROOT", false),
            ];
        } else {
            switch (element.name) { // First-level
                case Category.Favorite:
                    const nodes: IProblem[] = this.treeData[Category.Favorite];
                    return nodes.map((p: IProblem) => new LeetCodeNode(p, Category.Favorite));
                case Category.Difficulty:
                case Category.Tag:
                case Category.Company:
                    return this.composeSubCategoryNodes(element);
                default: // Second and lower levels
                    return element.isProblem ? [] : this.composeProblemNodes(element);
            }
        }
    }

    private async getProblemData(): Promise<void> {
        // clear cache
        this.treeData = {
            Difficulty: new Map<string, IProblem[]>(),
            Tag: new Map<string, IProblem[]>(),
            Company: new Map<string, IProblem[]>(),
            Favorite: [],
        };
        for (const problem of await list.listProblems()) {
            // Add favorite problem, no matter whether it is solved.
            if (problem.isFavorite) {
                this.treeData[Category.Favorite].push(problem);
            }
            // Hide solved problem in other category.
            if (problem.state === ProblemState.AC && getWorkspaceConfiguration().get<boolean>("hideSolved")) {
                continue;
            }

            this.addProblemToTreeData(problem);
        }
    }

    private composeProblemNodes(node: LeetCodeNode): LeetCodeNode[] {
        const map: Map<string, IProblem[]> | undefined = this.treeData[node.parentName];
        if (!map) {
            leetCodeChannel.appendLine(`Category: ${node.parentName} is not available.`);
            return [];
        }
        const problems: IProblem[] = map.get(node.name) || [];
        const problemNodes: LeetCodeNode[] = [];
        for (const problem of problems) {
            problemNodes.push(new LeetCodeNode(problem, node.name));
        }
        return problemNodes;
    }

    private composeSubCategoryNodes(node: LeetCodeNode): LeetCodeNode[] {
        const category: Category = node.name as Category;
        if (category === Category.Favorite) {
            leetCodeChannel.appendLine("No sub-level for Favorite nodes");
            return [];
        }
        const map: Map<string, IProblem[]> | undefined = this.treeData[category];
        if (!map) {
            leetCodeChannel.appendLine(`Category: ${category} is not available.`);
            return [];
        }
        return this.getSubCategoryNodes(map, category);
    }

    private parseIconPathFromProblemState(element: LeetCodeNode): string {
        if (!element.isProblem) {
            return "";
        }
        switch (element.state) {
            case ProblemState.AC:
                return this.context.asAbsolutePath(path.join("resources", "check.png"));
            case ProblemState.NotAC:
                return this.context.asAbsolutePath(path.join("resources", "x.png"));
            case ProblemState.Unknown:
                if (element.locked) {
                    return this.context.asAbsolutePath(path.join("resources", "lock.png"));
                }
                return this.context.asAbsolutePath(path.join("resources", "blank.png"));
            default:
                return "";
        }
    }

    private getSubCategoryTooltip(element: LeetCodeNode): string {
        // return '' unless it is a sub-category node
        if (element.isProblem || !this.treeData[element.parentName]) {
            return "";
        }

        const problems: IProblem[] = this.treeData[element.parentName].get(element.id);

        let acceptedNum: number = 0;
        let failedNum: number = 0;
        for (const prob of problems) {
            switch (prob.state) {
                case ProblemState.AC:
                    acceptedNum++;
                    break;
                case ProblemState.NotAC:
                    failedNum++;
                    break;
                default:
                    break;
            }
        }

        return [
            `AC: ${acceptedNum}`,
            `Failed: ${failedNum}`,
            `Total: ${problems.length}`,
        ].join(os.EOL);
    }

    private addProblemToTreeData(problem: IProblem): void {
        this.putProblemToMap(this.treeData.Difficulty, problem.difficulty, problem);
        for (const tag of problem.tags) {
            this.putProblemToMap(this.treeData.Tag, this.beautifyCategoryName(tag), problem);
        }
        for (const company of problem.companies) {
            this.putProblemToMap(this.treeData.Company, this.beautifyCategoryName(company), problem);
        }
    }

    private putProblemToMap(map: Map<string, IProblem[]>, key: string, problem: IProblem): void {
        const problems: IProblem[] | undefined = map.get(key);
        if (problems) {
            problems.push(problem);
        } else {
            map.set(key, [problem]);
        }
    }

    private beautifyCategoryName(name: string): string {
        return name.split("-").map((c: string) => c[0].toUpperCase() + c.slice(1)).join(" ");
    }

    private getSubCategoryNodes(map: Map<string, IProblem[]>, category: Category): LeetCodeNode[] {
        const subCategoryNodes: LeetCodeNode[] = Array.from(map.keys()).map((subCategory: string) => {
            return new LeetCodeNode(Object.assign({}, defaultProblem, {
                id: subCategory,
                name: subCategory,
            }), category.toString(), false);
        });
        this.sortSubCategoryNodes(subCategoryNodes, category);
        return subCategoryNodes;
    }

    private sortSubCategoryNodes(subCategoryNodes: LeetCodeNode[], category: Category): void {
        switch (category) {
            case Category.Difficulty:
                subCategoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                    function getValue(input: LeetCodeNode): number {
                        switch (input.name.toLowerCase()) {
                            case "easy":
                                return 1;
                            case "medium":
                                return 2;
                            case "hard":
                                return 3;
                            default:
                                return Number.MAX_SAFE_INTEGER;
                        }
                    }
                    return getValue(a) - getValue(b);
                });
            case Category.Tag:
            case Category.Company:
                subCategoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                    if (a.name === "Unknown") {
                        return 1;
                    } else if (b.name === "Unknown") {
                        return -1;
                    } else {
                        return Number(a.name > b.name) - Number(a.name < b.name);
                    }
                });
            default:
                break;
        }
    }
}
