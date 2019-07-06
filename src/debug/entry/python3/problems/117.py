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
    first = Node(param[0], None, None, None)
    arr = []
    arr.append([first, 0])

    for i, val in enumerate(param):
        if i is 0:
            continue

        top = arr[0]
        val = None if param[i] is None else Node(param[i], None, None, None)
        if top[1] is 0:
            top[0].left = val
            top[1] = 1
        else:
            top[0].right = val
            arr.pop(0)

        if val is not None:
            arr.append([val, 0])

    return first


def parseSpecialParameter(index, paramType, param):
    if paramType == "Node":
        return parseNode(param)
    return None
