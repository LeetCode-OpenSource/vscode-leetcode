function runUserScript(userFunm, params, paramTypes) {
    if (params.length !== paramTypes.length) {
        onParameterError();
    }

    const parsedParams = params.map((param, index) => {
        const type = paramTypes[index];
        return parseParameter(index, type, param);
    });
    userFunm.apply(null, parsedParams);
}

function Node(val, left, right, next) {
    this.val = val;
    this.left = left;
    this.right = right;
    this.next = next;
}

/**
 * @param {number[]} param
 */
function parseNode(nums) {
    const arr = [];
    nums.map((n, i) => {
        const node = new Node(n);
        arr.push(node);
        if (i !== 0) {
            if (i % 2 === 1) {
                arr[(i - 1) / 2].left = node;
            } else {
                arr[(i - 2) / 2].right = node;
            }
        }
    });
    return arr[0];
}

function parseSpecialParameter(index, type, param) {
    switch (type) {
        case "Node":
            return parseNode(param);
    }
    return null;
}
