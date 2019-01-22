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
        Company: Map<string, list.IProblem[]>
    }

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
            id: `${idPrefix}.${element.id}`,
            collapsibleState: element.isProblem ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: element.isProblem ? "problem" : "difficulty",
            iconPath: this.parseIconPathFromProblemState(element),
        };
    }

    public getChildren(element?: LeetCodeNode | undefined): vscode.ProviderResult<LeetCodeNode[]> {
        if (!leetCodeManager.getUser()) {
            return [
                new LeetCodeNode(
                    Object.assign(list.IProblemDefault, {
                        id: "notSignIn",
                        name: "Sign in to LeetCode",
                    }),
                    false,
                ),
            ];
        }
        if (!element) { // Root view
            return new Promise(async (resolve: (res: LeetCodeNode[]) => void): Promise<void> => {
                await this.getProblemData();
                resolve([
                    new LeetCodeNode(Object.assign(list.IProblemDefault, {
                        id: "Root",
                        name: "Difficulty",
                    }), false),
                    new LeetCodeNode(Object.assign(list.IProblemDefault, {
                        id: "Root",
                        name: "Tag",
                    }), false),
                    new LeetCodeNode(Object.assign(list.IProblemDefault, {
                        id: "Root",
                        name: "Company",
                    }), false)
                ]);
            });
        } else {
            switch (element.name) { // First-level
                case "Difficulty":
                case "Tag":
                case "Company":
                    return this.composeCategoryNodes(element);
                default: // Second and lower levels
                    return element.isProblem ? [] : this.composeProblemNodes(element);
            }
        }
    }

    private async getProblemData(): Promise<void> {
        this.treeData = {
            Difficulty: new Map(),
            Tag: new Map(),
            Company: new Map()
        }
        for (const problem of await list.listProblems()) {
            const categories = [
                ["Difficulty", [problem.difficulty]],
                ["Tag", problem.tags],
                ["Company", problem.companies]
            ] as [Category, string[]][];
            for (const [parent, children] of categories) {
                for (const subCategory of children) {
                    const problems = this.treeData[parent].get(subCategory);
                    if (problems) {
                        problems.push(problem);
                    } else {
                        this.treeData.Difficulty.set(subCategory, [problem]);
                    }
                }
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
        const parent = node.id as Category;
        const categoryNodes = Array.from(this.treeData[parent].keys()).map(subCategory =>
            new LeetCodeNode(Object.assign(list.IProblemDefault, {
                id: node.name,
                name: subCategory,
            }), false)
        );
        if (parent == "Difficulty") {
            categoryNodes.sort((a: LeetCodeNode, b: LeetCodeNode): number => {
                function getValue(input: string): number {
                    switch (input.toLowerCase()) {
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
                return getValue(a.name) - getValue(b.name);
            });
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
