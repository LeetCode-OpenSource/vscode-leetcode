function runUserScript(userFunm, params, paramTypes) {
    if (params.length !== 2) {
        onParameterError();
    }
    const version = params[1];
    const n = params[0];
    const isBadVersion = function (k) {
        if (k >= version) {
            return true;
        }
        return false;
    }
    userFunm(isBadVersion)(n);
}


function parseSpecialParameter(index, type, param) {
    return null;
}
