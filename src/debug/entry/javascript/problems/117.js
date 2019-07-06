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
    this.val = val === undefined ? null : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
    this.next = next === undefined ? null : next;
}

/**
 * @param {number[]} param
 */
function parseNode(param) {
    if (param.length == 0) {
        return null;
    }
    const first = new Node(param[0]);
    const queue = [[first, 0]];
    for (let j = 1; j < param.length; j++) {
        const top = queue[0];
        const val = param[j] === null ? null : new Node(param[j]);
        if (top[1] === 0) {
            top[0].left = val;
            top[1] = 1;
        } else {
            top[0].right = val;
            queue.shift();
        }
        if (val !== null) {
            queue.push([val, 0]);
        }
    }
    return first;
}

function parseSpecialParameter(index, type, param) {
    switch (type) {
        case "Node":
            return parseNode(param);
    }
    return null;
}
