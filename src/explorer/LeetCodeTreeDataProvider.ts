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

    private allProblems: Map<string, IProblem>; // maintains the ownership of all problems.

    private treeData: {
        [Category.All]: IProblem[],
        [Category.Difficulty]: Map<string, IProblem[]>,
        [Category.Tag]: Map<string, IProblem[]>,
        [Category.Company]: Map<string, IProblem[]>,
        [Category.Favorite]: IProblem[],
    };

    private onDidChangeTreeDataEvent: vscode.EventEmitter<LeetCodeNode> = new vscode.EventEmitter<LeetCodeNode>();
    // tslint:disable-next-line:member-ordering
    public readonly onDidChangeTreeData: vscode.Event<LeetCodeNode> = this.onDidChangeTreeDataEvent.event;

    constructor(private context: vscode.ExtensionContext) { }

    public async refresh(): Promise<void> {
        await this.getFullProblemData();
        this.onDidChangeTreeDataEvent.fire();
    }

    public async updateProblem(problem: IProblem): Promise<void> {
        if (this.allProblems.has(problem.id)) {
            this.updateTreeDataByProblem(problem); // only modify the content of tree data, problem is not updated.
            Object.assign(this.allProblems.get(problem.id), problem); // update problem, where reference is preserved.
            this.onDidChangeTreeDataEvent.fire();
        }
    }

    public getTreeItem(element: LeetCodeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.id === "NotSignIn") {
            return {
                label: element.name,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "leetcode.signin",
                    title: "Sign in to LeetCode",
                },
            };
        } else if (!element.isProblem) { // category
            return {
                label: element.name,
                tooltip: this.getSubCategoryTooltip(element),
                id: `LeetCode.Category::${element.parentId}.${element.id}`,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: `${element.parentId}.${element.id}`.toLowerCase(),
            };
        } else { // problem
            return {
                label: `[${element.id}] ${element.name} ${element.isFavorite ? "♥" : ""}`,
                tooltip: "", // TODO: Add Problem Tooltip
                id: `LeetCode.Problem::${element.parentId}.${element.id}`,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: "problem",
                iconPath: this.parseIconPathFromProblemState(element),
            };
        }
    }

    public getChildren(element?: LeetCodeNode | undefined): vscode.ProviderResult<LeetCodeNode[]> {
        if (!leetCodeManager.getUser()) {
            return [
                new LeetCodeNode(Object.assign({}, defaultProblem, {
                    id: "NotSignIn",
                    name: "Sign in to LeetCode",
                }), "Root", false),
            ];
        }
        if (!element) { // Root view
            return [
                Category.All,
                Category.Difficulty,
                Category.Tag,
                Category.Company,
                Category.Favorite,
            ].map((c: Category) => new LeetCodeNode(
                Object.assign({}, defaultProblem, { id: c, name: c }), "Root", false,
            ));
        } else {
            // First-level
            switch (element.name) {
                case Category.All:
                case Category.Favorite:
                    const nodes: IProblem[] = this.treeData[element.name];
                    return nodes.map((p: IProblem) => new LeetCodeNode(p, element.name));
                case Category.Difficulty:
                case Category.Tag:
                case Category.Company:
                    return this.composeSubCategoryNodes(element);
            }
            // Second and lower levels
            return element.isProblem ? [] : this.composeProblemNodes(element);
        }
    }

    private async getFullProblemData(): Promise<void> {
        // clear cache
        this.allProblems = new Map<string, IProblem>();
        this.treeData = {
            [Category.All]: [],
            [Category.Difficulty]: new Map<string, IProblem[]>(),
            [Category.Tag]: new Map<string, IProblem[]>(),
            [Category.Company]: new Map<string, IProblem[]>(),
            [Category.Favorite]: [],
        };
        for (const problem of await list.listProblems()) {
            // Add every problem to problem pool
            this.allProblems.set(problem.id, problem);
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
        const map: Map<string, IProblem[]> | undefined = this.treeData[node.parentId];
        if (!map) {
            leetCodeChannel.appendLine(`Category: ${node.parentId} is not available.`);
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
        if (category === Category.All || category === Category.Favorite) {
            leetCodeChannel.appendLine("No sub-level for All or Favorite nodes");
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
        if (!element.isProblem) { // In fact will never be satisfied
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
        // return '' if it does not directly hold problems.
        if (element.isProblem) { // In fact will never be satisfied
            return "";
        }
        let problems: IProblem[];
        switch (element.name) {
            case Category.Difficulty:
            case Category.Tag:
            case Category.Company:
                return "";
            case Category.All:
            case Category.Favorite:
                problems = this.treeData[element.name];
                break;
            default:
                problems = this.treeData[element.parentId].get(element.id);
        }

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

    private updateTreeDataByProblem(problem: IProblem): void {
        const origin: IProblem | undefined = this.allProblems.get(problem.id);
        if (origin && origin.isFavorite !== problem.isFavorite) {
            // Find appropriate index to insert/delete a problem
            const problemIndex: number = this.treeData[Category.Favorite].findIndex((p: LeetCodeNode) => Number(p.id) >= Number(problem.id));
            if (problem.isFavorite) {
                this.treeData[Category.Favorite].splice(problemIndex, 0, origin); // insert original problem's reference as favorite
            } else {
                this.treeData[Category.Favorite].splice(problemIndex, 1); // delete favorite
            }
        }
    }

    private addProblemToTreeData(problem: IProblem): void {
        this.treeData[Category.All].push(problem);
        this.putProblemToMap(this.treeData[Category.Difficulty], problem.difficulty, problem);
        for (const tag of problem.tags) {
            this.putProblemToMap(this.treeData[Category.Tag], this.beautifyCategoryName(tag), problem);
        }
        for (const company of problem.companies) {
            this.putProblemToMap(this.treeData[Category.Company], this.beautifyCategoryName(company), problem);
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
                break;
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
                break;
            default:
                break;
        }
    }
}
