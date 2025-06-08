#!/bin/bash

cd "$(dirname "$0")" || exit 1;

# this will be called with either:
# - 'config' to create the config for the plugin
# - 'install' to install the plugin
COMMAND=$1;

if [ "$COMMAND" == "config" ]; then
    CLUSTER_NAME=""
    for arg in "$@"; do
      if [[ $arg == --clusterName=* ]]; then
        CLUSTER_NAME="${arg#--clusterName=}"
      fi
    done

    # create certificate authority private key
    openssl genrsa -out tls.key 2048

    # ask user what their self signed certificate should be called, or default to cluster name
    read -r -p "Enter the name for your self-signed certificate ($CLUSTER_NAME): " CERT_NAME
    if [[ $CERT_NAME == "" ]]; then CERT_NAME=$CLUSTER_NAME; fi

    # create CA using key we created in the previous step, valid for 100 years
    openssl req -new -x509 -sha256 -days 36525 -key tls.key -subj "/CN=$CERT_NAME" -out tls.crt;

    CACRT=$(base64 -w0 < tls.crt);
    CAKEY=$(base64 -w0 < tls.key);

    echo "tls.crt: $CACRT"
    echo "tls.key: $CAKEY"

    # TODO get these should be added as config in kdev config file
    # the tls.crt can be added as a cert in firefox

    exit 0;
fi

if [ "$COMMAND" == "install" ]; then
  CLUSTER_NAME=""
  CONFIG=""

  for arg in "$@"; do
    if [[ $arg == --clusterName=* ]]; then CLUSTER_NAME="${arg#--clusterName=}"; fi
    if [[ $arg == --config=* ]]; then CONFIG="${arg#--config=}"; fi
  done

  echo "$CONFIG" | yq -p=json > .resource-values.yaml
  yq -i ".clusterName = \"$CLUSTER_NAME\"" .resource-values.yaml
  skaffold run 2> /dev/null;
  rm .resource-values.yaml
fi
