// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import { IProblem, ProblemState } from "../shared";

export class LeetCodeNode {
    constructor(
        private data: IProblem,
        private parentNodeId: string,
        private isProblemNode: boolean = true) { }

    public get nodeData(): IProblem {
        return this.data;
    }

    public get isProblem(): boolean {
        return this.isProblemNode;
    }

    public get parentId(): string {
        return this.parentNodeId;
    }

    public get locked(): boolean {
        return this.data.locked;
    }

    public get name(): string {
        return this.data.name;
    }

    public get id(): string {
        return this.data.id;
    }

    public get passRate(): string {
        return this.data.passRate;
    }

    public get difficulty(): string {
        return this.data.difficulty;
    }

    public get tags(): string[] {
        return this.data.tags;
    }

    public get companies(): string[] {
        return this.data.companies;
    }

    public get state(): ProblemState {
        return this.data.state;
    }

    public get isFavorite(): boolean {
        return this.data.isFavorite;
    }
}
