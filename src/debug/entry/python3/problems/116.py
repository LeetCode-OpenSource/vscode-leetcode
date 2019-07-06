def runUserScript(func, params, paramTypes):
    if (len(params) != len(paramTypes)):
        onParameterError()

    newParams = []
    for i, val in enumerate(params):
        newParams.append(parseParameter(i, paramTypes[i], val))
    func(*newParams)


class Node:
    def __init__(self, val, left, right, next):
        self.val = val
        self.left = left
        self.right = right
        self.next = next


def parseNode(param):
    arr = []

    for i, val in enumerate(param):
        node = Node(val, None, None, None)
        arr.append(node)
        if i is not 0:
            if i % 2 is 1:
                arr[int((i - 1) / 2)].left = node
            else:
                arr[int((i - 2) / 2)].right = node

    return arr[0]


def parseSpecialParameter(index, paramType, param):
    if paramType == "Node":
        return parseNode(param)
    return None
