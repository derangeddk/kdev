#!/usr/bin/env bash

# shellcheck disable=SC1091
# disable follow source rule

source constants.sh

# stops all the cluster nodes
for node in $(kind get nodes --name "$KIND_NAME"); do
  docker stop "${node}"
done

# stop the registry node
docker stop "$REGISTRY"
