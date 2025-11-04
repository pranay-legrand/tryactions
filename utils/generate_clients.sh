#! /bin/sh

set -eu

# DIR of this script
DIR=$(realpath $(dirname "$0"))

# Source env vars
source $DIR/../test.config

# OpenAPI Generator: https://openapi-generator.tech/docs/generators/typescript-node
GENERATOR="typescript-fetch"

for VERSION in v0 v1; do
    OUTPUT_DIR=$DIR/../client/$VERSION/openapi
    rm -rf $OUTPUT_DIR
    npx openapi-generator-cli generate \
        -i $DIR/../client/$VERSION/$OPENAPI_FILE_NAME \
        -g $GENERATOR \
        -o $OUTPUT_DIR \
        --additional-properties=enumPropertyNaming=original \
        --additional-properties=paramNaming=camelCase \
        --additional-properties=modelPropertyNaming=original
done

# Fix the generated code
# - I did not investigate any time to understand why the generator does not generate the correct code
# - Simple fixes to make the tests running
sed -i "s/'device'/'device-management'/g" client/v1/openapi/models/LogRecord.ts
sed -i "s/'discoveryTask'/'discovery:task'/g" client/v1/openapi/models/LogRecord.ts
sed -i "s/'discoveredDevice'/'discovery:device-discovered'/g" client/v1/openapi/models/LogRecord.ts
# Add 'Accept' header to LoginApi to ensure JSON response
sed -i "s/'bulkUpdate'/'bulk-update:bulk-update'/g" client/v1/openapi/models/LogRecord.ts
sed -i "s/'deviceUpdate'/'bulk-update:device-update'/g" client/v1/openapi/models/LogRecord.ts
