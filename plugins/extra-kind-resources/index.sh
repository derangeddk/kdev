#!/bin/bash

cd "$(dirname "$0")" || exit 1;

# this will be called with:
# - 'install' to install the plugin
COMMAND=$1;

if [ "$COMMAND" == "install" ]; then
  CONFIG=""

  for arg in "$@"; do
    if [[ $arg == --config=* ]]; then CONFIG="${arg#--config=}"; fi
  done

  echo "$CONFIG" | yq -p=json > .values.yaml;

  skaffold run 2> /dev/null;
  rm .values.yaml
fi

if [ "$COMMAND" == "install" ]; then
  CLUSTER_NAME=""
  CONFIG=""

  for arg in "$@"; do
    if [[ $arg == --clusterName=* ]]; then CLUSTER_NAME="${arg#--clusterName=}"; fi
    if [[ $arg == --config=* ]]; then CONFIG="${arg#--config=}"; fi
  done

  # delete these resources, so we can add it anew with modifications
  kubectl delete -n kube-system configmap coredns || true;
  skaffold delete || true;

  echo "$CONFIG" | yq -p=json > .values.yaml
  yq -i ".clusterName = \"$CLUSTER_NAME\"" .values.yaml
  skaffold run 2> /dev/null;
  rm .values.yaml
fi
