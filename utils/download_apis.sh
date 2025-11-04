#!/bin/bash

set -eu

# Download all APIs from the DUT server
# OpenAPI and AsyncAPI v0 + v1

# DIR of this script
DIR=$(realpath $(dirname "$0"))

# Source env vars
source $DIR/../test.config

# cleanup before have multiple versions
rm -rf $DIR/../client/v0/$OPENAPI_FILE_NAME
rm -rf $DIR/../client/v0/$ASYNCAPI_FILE_NAME
rm -rf $DIR/../client/v1/$OPENAPI_FILE_NAME
rm -rf $DIR/../client/v1/$ASYNCAPI_FILE_NAME

# Ensure the directory exists
mkdir -p $DIR/../client/v0
mkdir -p $DIR/../client/v1

# Download all APIs
wget --no-check-certificate --verbose --directory-prefix $DIR/../client/v0 $DUT_OPENAPI_V0_URL
wget --no-check-certificate --verbose --directory-prefix $DIR/../client/v0 $DUT_ASYNCAPI_V0_URL
wget --no-check-certificate --verbose --directory-prefix $DIR/../client/v1 $DUT_OPENAPI_V1_URL
wget --no-check-certificate --verbose --directory-prefix $DIR/../client/v1 $DUT_ASYNCAPI_V0_URL

echo "Finished downloading APIs"

# Add DUT server as first server
LINE_NUMBER=$(grep -n "servers:" $DIR/../client/v0/$OPENAPI_FILE_NAME | cut -d: -f1)
sed -i "$((LINE_NUMBER+1))i - description: DUT Machine" $DIR/../client/v0/$OPENAPI_FILE_NAME
sed -i "$((LINE_NUMBER+2))i \  url: https://$DUT_ADDRESS/api/v0" $DIR/../client/v0/$OPENAPI_FILE_NAME

LINE_NUMBER=$(grep -n "servers:" $DIR/../client/v1/$OPENAPI_FILE_NAME | cut -d: -f1)
sed -i "$((LINE_NUMBER+1))i - description: DUT Machine" $DIR/../client/v1/$OPENAPI_FILE_NAME
sed -i "$((LINE_NUMBER+2))i \  url: https://$DUT_ADDRESS/api/v1" $DIR/../client/v1/$OPENAPI_FILE_NAME
