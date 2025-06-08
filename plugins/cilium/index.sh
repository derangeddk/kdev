#!/bin/bash

cd "$(dirname "$0")" || exit 1;

# this will be called with:
# - 'install' to install the plugin
COMMAND=$1;

if [ "$COMMAND" == "install" ]; then
   skaffold run 2> /dev/null;
fi
