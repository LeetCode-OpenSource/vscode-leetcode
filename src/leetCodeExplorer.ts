// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as vscode from "vscode";
import * as list from "./commands/list";
import { leetCodeManager } from "./leetCodeManager";
import { ProblemState } from "./shared";

export type Category = "Difficulty" | "Tag" | "Company";

// tslint:disable:max-classes-per-file
export class LeetCodeNode {
    constructor(private data: list.IProblem, private isProblemNode: boolean = true) { }

    public get locked(): boolean {
        return this.data.locked;
    }
    public get name(): string {
        return this.data.name;
    }

    public get state(): ProblemState {
        return this.data.state;
    }

    public get id(): string {
        return this.data.id;
    }

    public get passRate(): string {
        return this.data.passRate;
    }

    public get isProblem(): boolean {
        return this.isProblemNode;
    }
}

export class LeetCodeTreeDataProvider implements vscode.TreeDataProvider<LeetCodeNode> {

    private treeData: {
        Difficulty: Map<string, list.IProblem[]>,
        Tag: Map<string, list.IProblem[]>,
        Company: Map<string, list.IProblem[]>,
        Favorite: list.IProblem[],
        Accepted: list.IProblem[],
        NotAccepted: list.IProblem[],
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
        return { // element.id -> parent node name, element.name -> node name
            label: element.isProblem ? `[${element.id}] ${element.name}` : element.name,
            id: `${idPrefix}.${element.id}.${element.name}`,
            collapsibleState: element.isProblem ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: element.isProblem ? "problem" : element.id.toLowerCase(),
            iconPath: this.parseIconPathFromProblemState(element),
        };
    }

    public getChildren(element?: LeetCodeNode | undefined): vscode.ProviderResult<LeetCodeNode[]> {
        if (!leetCodeManager.getUser()) {
            return [
                new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                    id: "notSignIn",
                    name: "Sign in to LeetCode",
                }), false),
            ];
        }
        if (!element) { // Root view
            return new Promise(async (resolve: (res: LeetCodeNode[]) => void): Promise<void> => {
                await this.getProblemData();
                resolve([
                    new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                        id: "Root",
                        name: "Difficulty",
                    }), false),
                    new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                        id: "Root",
                        name: "Tag",
                    }), false),
                    new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                        id: "Root",
                        name: "Company",
                    }), false),
                    new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                        id: "Root",
                        name: "Favorite",
                    }), false),
                    new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                        id: "Root",
                        name: "Accepted",
                    }), false),
                    new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                        id: "Root",
                        name: "Not Accepted",
                    }), false),
                ]);
            });
        } else {
            switch (element.name) { // First-level
                case "Difficulty":
                case "Tag":
                case "Company":
                    return this.composeCategoryNodes(element);
                case "Favorite":
                    return this.treeData.Favorite.map((p: list.IProblem) => new LeetCodeNode(p));
                case "Accepted":
                    return this.treeData.Accepted.map((p: list.IProblem) => new LeetCodeNode(p));
                case "Not Accepted":
                    return this.treeData.NotAccepted.map((p: list.IProblem) => new LeetCodeNode(p));
                default: // Second and lower levels
                    return element.isProblem ? [] : this.composeProblemNodes(element);
            }
        }
    }

    private async getProblemData(): Promise<void> {
        this.treeData = {
            Difficulty: new Map(),
            Tag: new Map(),
            Company: new Map(),
            Favorite: [],
            Accepted: [],
            NotAccepted: [],
        };
        for (const problem of await list.listProblems()) {
            // Add problems according to category
            const categories: Array<[Category, string[]]> = [
                ["Difficulty", [problem.difficulty]],
                ["Tag", problem.tags],
                ["Company", problem.companies],
            ];
            for (const [parent, children] of categories) {
                for (let subCategory of children) {
                    // map 'first-second' to 'First Second'
                    subCategory = subCategory.split("-").map((c: string) => c[0].toUpperCase() + c.slice(1)).join(" ");
                    const problems: list.IProblem[] | undefined = this.treeData[parent].get(subCategory);
                    if (problems) {
                        problems.push(problem);
                    } else {
                        this.treeData[parent].set(subCategory, [problem]);
                    }
                }
            }
            // Filter by favorite problems
            if (problem.favorite) {
                this.treeData.Favorite.push(problem);
            }
            // Filter by problem state
            if (problem.state === ProblemState.AC) {
                this.treeData.Accepted.push(problem);
            } else if (problem.state === ProblemState.NotAC) {
                this.treeData.NotAccepted.push(problem);
            }
        }
    }

    private composeProblemNodes(node: LeetCodeNode): LeetCodeNode[] {
        // node.id stores the parent node name, node.name stores current node name.
        const problems: list.IProblem[] | undefined = this.treeData[node.id].get(node.name);
        if (!problems || problems.length === 0) {
            return [];
        }
        const problemNodes: LeetCodeNode[] = [];
        for (const problem of problems) {
            problemNodes.push(new LeetCodeNode(problem));
        }
        return problemNodes;
    }

    private composeCategoryNodes(node: LeetCodeNode): LeetCodeNode[] {
        const parent: Category = node.name as Category;
        const categoryNodes: LeetCodeNode[] =
            Array.from(this.treeData[parent].keys()).map((subCategory: string) =>
                new LeetCodeNode(Object.assign({}, list.IProblemDefault, {
                    id: parent,
                    name: subCategory,
                }), false));
        // Sort lists
        switch (parent) {
            case "Difficulty": {
                categoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
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
            }
            case "Tag":
            case "Company": {
                categoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                    if (a.name === "Unknown") {
                        return 1;
                    } else if (b.name === "Unknown") {
                        return -1;
                    } else {
                        return Number(a.name > b.name) - Number(a.name < b.name);
                    }
                });
            }
        }
        return categoryNodes;
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
}
