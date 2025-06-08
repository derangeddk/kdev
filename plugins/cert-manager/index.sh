#!/bin/bash

cd "$(dirname "$0")" || exit 1;

# this will be called with either:
# - 'config' to create the config for the plugin
# - 'install' to install the plugin
COMMAND=$1;

if [ "$COMMAND" == "config" ]; then
    # create certificate authority private key
    openssl genrsa 4096 -out ca.key

    # create CA using key we created in the previous step, valid for 100 years
    openssl req -new -x509 -sha256 -days 36525 -key ca.key -out ca.crt

    CACRT=$(cat ca.crt | base64 -w0)
    CAKEY=$(cat ca.key | base64 -w0)

    # TODO ask if these should be added as config in kdev config file

    exit 0;
fi

if [ "$COMMAND" == "install" ]; then
  echo "${2//--config=/}" | yq -p=json > .resource-values.yaml
  skaffold run 2> /dev/null;
  rm .resource-values.yaml
fi
