# Plugins

Plugins are docker containers that can be executed with different commands for plugin lifecycle management.

Plugins should have the following lifecycle hooks:

## Configuration

Configuration is a script that outputs the plugins configuration. It can be run on-demand or on install. It can be non-interactive by just outputting a default configuration.

## Installation

Install is called during **kdev** cluster creation.

## Notes

Can we make speficic helm/skaffold plugins that are merely a skaffold config and a values file?

git+https://github.com/visionmedia/express.git/
oci://docker.io/deranged/kdev-plugin-minio
npm://kdev-plugin-minio@1.0.0
file://plugins/minio/index.sh
builtin://cilium

## TODO

## (Maybe?) Up/down/stop
