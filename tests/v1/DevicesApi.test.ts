import {describe, expect, test} from '@jest/globals';
import { Device, DevicesApi, ResponseError } from '../../client/v1/openapi';
import { readFile } from "node:fs/promises";
import { doRequest, DefaultConfiguration, getRequestErrorFromResponseError } from './utils';


const RESOURCE_PATH = __dirname + "/../../resources/";

// Test system API version 1
describe('Devices API V1', () => {

    describe('Create and delete a device', () => {

        // Can create a device with access point
        test('Create a device', async () => {
            const devicesApi = new DevicesApi(DefaultConfiguration);

            const newDevice: Device = {
                id: 0, // Dummy ID, will be not sent to server
                accessPoints: [ {
                    id: 0, // Dummy ID, will be not sent to server
                    protocol: "https",
                    ipAddress: "192.168.7.20"
                } ],
            };

            const device = await doRequest(() => {
                return devicesApi.createDevice({ device: newDevice });
            });

            expect(device.id).toBeDefined();

            // Delete the created device
            await doRequest(() => {
                return devicesApi.deleteDeviceById({ id: device.id });
            });
        });
    });

    describe('Device by ID', () => {

        // Get a device with not existing ID
        test('Wrong ID returns an error', async () => {
            expect.assertions(5); // five assertion expected

            try {
                const devicesApi = new DevicesApi(DefaultConfiguration);
                await devicesApi.getDeviceById({id: -1});
            } catch (error) {
                if (error instanceof ResponseError) {
                    // Check the status code
                    expect(error.response.status).toBe(404);

                    // Parse and validate the error
                    const reqErr = await getRequestErrorFromResponseError(error);
                    expect(reqErr.errors[0].context).toBe("REST");
                    expect(reqErr.errors[0].id).toBe("DeviceIdNotFound");
                    expect(reqErr.errors[0].params).toStrictEqual(["-1"]);
                    expect(reqErr.errors[0].message).toBe("Device ID not found: -1");
                } else {
                    throw error; // rethrow
                }
            }
        });
    });

    describe("Import devices from CSV", () => {
        test('Import from a CSV file with header', async () => {
            const path = RESOURCE_PATH + "device_import_header.csv";

            // A file object with correct name and MIME type is required
            const blob = new Blob([await readFile(path)]);
            const file = new File([blob], /* filename */ "device_import_header.csv", { /* mimetype */ type: "text/csv" });

            const devicesApi = new DevicesApi(DefaultConfiguration);
            // use the raw response to check the status code is 204/No content
            const response = await doRequest(() => {
                return devicesApi.importDevicesRaw({ file });
            });

            expect(response.raw.status).toBe(204);
        });
    });
});
