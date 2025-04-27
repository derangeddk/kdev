#!/bin/bash

cd "$(dirname "$0")" || exit 1;

# this will be called with either:
# - 'config' to create the config for the plugin
# - 'install' to install the plugin
COMMAND=$1;

if [ "$COMMAND" == "config" ]; then
    # we output nothing as there is nothing to configure

    # openssl genrsa 2048 > host.key
    # chmod 400 host.key
    # openssl req -new -x509 -nodes -sha256 -days 365 -key host.key -out host.cert

    exit 0;
fi

if [ "$COMMAND" == "install" ]; then
   skaffold run 2> /dev/null;
fi
