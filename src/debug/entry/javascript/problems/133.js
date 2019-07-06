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

function Node(val, neighbors) {
    this.val = val;
    this.neighbors = neighbors;
}

/**
 * @param {number[][]} param
 */
function parseNode(nums) {
    const arr = [];
    nums.map((n, i) => {
        arr.push(new Node(i + 1, []));
    });
    nums.map((nei, i) => {
        nei.map(k => {
            arr[i].neighbors.push(arr[k - 1]);
        });
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
