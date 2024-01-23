#!/usr/bin/env bash

# shellcheck disable=SC1091
# disable follow source rule

source constants.sh

# starts all the cluster nodes
for node in $(kind get nodes --name "$KIND_NAME"); do
  docker start "${node}"
done

# start the registry node
docker start "$REGISTRY"
