import { UserDataType } from "../globalState";
import { getUrl } from "../shared";
import { LcAxios } from "../utils/httpUtils";

const graphqlStr = `
    query globalData {
        userStatus {
            isPremium
            isVerified
            username
            avatar
            isSignedIn
        }
    }
`;

interface IUserStatusResponse {
    data?: {
        userStatus?: UserDataType;
    };
}

export const queryUserData = async (cookie?: string): Promise<UserDataType> => {
    const response = await LcAxios<IUserStatusResponse>(getUrl("userGraphql"), {
        method: "POST",
        data: {
            query: graphqlStr,
            variables: {},
        },
    }, cookie);

    const userStatus: UserDataType | undefined = response.data?.data?.userStatus;
    if (!userStatus) {
        throw new Error("LeetCode did not return user status.");
    }
    return userStatus;
};
