import {describe, expect, test} from '@jest/globals';
import { SystemApi } from '../../client/v0/openapi';
import { doRequest } from './utils';

// Test system API version 0
describe('System API V0', () => {

    describe('System Information', () => {

        // Nothing special to test here
        test('Get all information', async () => {
            const systemApi = new SystemApi();

            const info = await doRequest(() => {
                return systemApi.getSystemInformation();
            });

            expect(info.hostname).toBeDefined();
            expect(info.model).toBe("IDM");
            expect(info.version).toBeDefined();
            expect(info.api_versions).toBeDefined();
            expect(info.kernel).toBeDefined();
            expect(info.os).toBeDefined();
        });

        test('Get all information (RAW)', async () => {
            const systemApi = new SystemApi();

            const response = await doRequest(() => {
                return systemApi.getSystemInformationRaw();
            });

            expect(response.raw.status).toBe(200);

            const info = await response.value();
            expect(info.hostname).toBeDefined();
            expect(info.model).toBe("IDM");
            expect(info.version).toBeDefined();
            expect(info.api_versions).toBeDefined();
            expect(info.kernel).toBeDefined();
            expect(info.os).toBeDefined();
        });
    });

});
