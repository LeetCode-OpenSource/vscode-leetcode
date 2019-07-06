def runUserScript(func, params, paramTypes):
    if (len(params) != 2):
        onParameterError()

    version = params[1]
    n = params[0]

    def isBadVersion(k):
        if k > version:
            return True
        return False

    newParams = [n]
    func(*newParams)


def parseSpecialParameter(index, paramType, param):
    return None
