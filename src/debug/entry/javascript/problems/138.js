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

function Node(val, next, random) {
    this.val = val;
    this.next = next;
    this.random = random;
}

/**
 * @param {number[][]} param
 */
function parseNode(nums) {
    const arr = [];
    nums.map((n, i) => {
        arr.push(new Node(n[0], null, null));
    });
    nums.map((n, i) => {
        if (i !== nums.length - 1) {
            arr[i].next = arr[i + 1];
        }
        if (n[1] !== null) {
            arr[i].random = arr[n[1]];
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
