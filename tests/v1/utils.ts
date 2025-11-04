// V1 Client Utilities
import { Configuration } from "../../client/v1/openapi";
import { RequestError, JSONApiResponse, RequestErrorFromJSON, ResponseError } from '../../client/v1/openapi';

import * as defaults from "../defaults";

/**
 * Get the IDM RequestError instance from the ResponseError instance
 *
 * @param error A ResponseError instance
 * @returns The parsted IDM RequestError instance
 *
 * @example
 * ```typescript
 * try {
 *     const testApi = new TestApi();
 *     await testApi.getTest({id: -1});
 * } catch (error) {
 *     if (error instanceof ResponseError) {
 *         // check the status code
 *         expect(error.response.status).toBe(404);
 *
 *         // parse and validate the RequestError instance
 *         const reqErr = await getRequestErrorFromResponseError(error);
 *         expect(reqErr.errors[0].context).toBe("TEST");
 *         ...
 *     } else {
 *         throw error; // rethrow
 *     }
 * }
 * ```
 */
export function getRequestErrorFromResponseError(error: ResponseError): Promise<RequestError> {
    const requestError = new JSONApiResponse(error.response, (jsonValue) => RequestErrorFromJSON(jsonValue));
    return requestError.value();
}

/**
 * Utility function to print out catched errors
 *
 * @param func The function to execute
 */
export async function doRequest<T>(func: () => Promise<T>): Promise<T> {
    try {
        return await func();
    } catch (error) {
        console.error("Error in doRequest:");
        console.error(error);

        if (error instanceof ResponseError) { // v1 Response Error
            console.error("Response error text:");
            const txt = await error.response.text();
            console.error(txt);
        }

        throw error;
    }
}

export const DefaultConfiguration = new Configuration({
    username: defaults.USERNAME,
    password: defaults.PASSWORD,
    credentials: "include"
});
