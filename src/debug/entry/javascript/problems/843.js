function runUserScript(userFunm, params, paramTypes) {
    if (params.length !== 3) {
        onParameterError();
    }
    function Master(secret, wordlist) {
        this.guess = function(word) {
            if (!wordlist.includes(word)) {
                return -1;
            }

            let match = 0;
            for (let i = 0; i < word.length; i++) {
                if (word[i] === secret[i]) {
                    match += 1;
                }
            }
            return match;
        };
    }
    userFunm(params[1], new Master(params[0], params[1]));
}

function parseSpecialParameter(index, type, param) {
    return null;
}
