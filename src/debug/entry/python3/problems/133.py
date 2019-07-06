def runUserScript(func, params, paramTypes):
    if (len(params) != len(paramTypes)):
        onParameterError()

    newParams = []
    for i, val in enumerate(params):
        newParams.append(parseParameter(i, paramTypes[i], val))
    func(*newParams)


class Node:
    def __init__(self, val, neighbors):
        self.val = val
        self.neighbors = neighbors


def parseNode(param, nodeMap):
    arr = []
    for i, val in enumerate(param):
        arr.append(Node(i + 1, []))

    for i, val in enumerate(param):
        for j, k in enumerate(val):
            arr[i].neighbors.append(arr[k - 1])

    return arr[0]


def parseSpecialParameter(index, paramType, param):
    if paramType == "Node":
        return parseNode(param, None)
    return None
