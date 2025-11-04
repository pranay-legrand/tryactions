// V0 Client Utilities
import { ResponseError } from '../../client/v0/openapi';

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

        if (error instanceof ResponseError) { // v0 Response Error
            console.error("Response error text:");
            const txt = await error.response.text();
            console.error(txt);
        }

        throw error;
    }
}
