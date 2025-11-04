# IDM Black Box Tests

## How to start

Install node modules `npm install` and run command `npm run all` or `npm start` to

- download the OpenAPI spec files from the demo system
- generate all required clients
- run all tests

```sh
npm install
npm run all
```

The linter has an extra target. It runs with every merge request and must be successful. To execute it manually: `npm run lint`.

## Device Under Test

The default address of the *device under test* system is defined in file `test.config`.
You can use the `IDM_SYSTEM` environment to change the default device. Example

```sh
IDM_SYSTEM=192.168.7.152 npm run all
```

**NOTE:** The tests that are started via the pipeline file have their own defined test device. The default is overwritten. Please check variable `IDM_SYTEM` in file `.gitlab-ci.yml`.

### Username & Password

Only the IDM default username and password is currently supported. See file `tests/defaults.ts` to change them.

### OpenAPI Server List

The OpenAPI spec files will be patched to have the DUT system as first server defined.
Then we can simple use the default server (configuration).

If you run

```sh
IDM_SYSTEM=1.2.3.4 npm run test
```

will still use the server address used during generating the OpenAPI client. If you want an other address you have to run script `all`:

```sh
IDM_SYSTEM=1.2.3.4 npm run all
```

## HTTPS: IDM Certificate Check

Certificate validation is disabled for TLS connections. If active, then the *IDM Demo Certificate* would be rejected and all tests will fail.

Note: This works for the black box tests, but should not be used elsewhere!

Please see scripts `test` and `test:ci` in file `package.json`.

[NODE_TLS_REJECT_UNAUTHORIZED](https://nodejs.org/api/cli.html#node_tls_reject_unauthorizedvalue)
