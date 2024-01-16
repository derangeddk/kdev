#!/usr/bin/env bash

set -o errexit

# shellcheck disable=SC1091
# disable follow source rule

source constants.sh

kind delete cluster --name "$KIND_NAME"

if [ "$1" = '--all' ]; then
    docker kill "$REGISTRY"
    docker rm "$REGISTRY"
fi
