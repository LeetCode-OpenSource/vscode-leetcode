import {getUrl, getEndpoint, Endpoint} from "../shared";
import {LcAxios} from "../utils/httpUtils";
import {AxiosResponse} from "axios";


export const getDailyQueryStr = (): string => {
    const dailyQueryStrs = {
        LeetCode: `
            query questionOfToday {
                activeDailyCodingChallengeQuestion {
                    question {
                        frontendQuestionId: questionFrontendId
                    }
                }
            }
        `,
        LeetCodeCN: `
            query questionOfToday {
                todayRecord {
                    question {
                        frontendQuestionId: questionFrontendId
                    }
                }
            }
        `
    }
    const point: string = getEndpoint();
    switch (point) {
        case Endpoint.LeetCodeCN:
            return dailyQueryStrs.LeetCodeCN;
        case Endpoint.LeetCode:
            return dailyQueryStrs.LeetCode;
    }
    return "";
}

export const getDailyProblemID = (res: AxiosResponse<any, any>): string => {
    const point = getEndpoint();
    switch (point) {
        case Endpoint.LeetCodeCN:
            return res.data.data.todayRecord[0].question.frontendQuestionId;
        case Endpoint.LeetCode:
            return res.data.data.todayRecord[0].question.frontendQuestionId;
    }
    return "";
}

export const queryDailyChallenge = async (): Promise<string> => {
    return LcAxios(getUrl("graphql"), {
        method: "POST",
        data: {
            query: getDailyQueryStr(),
            variables: {},
            operationName: 'questionOfToday'
        },
    }).then((res) => getDailyProblemID(res));
};
