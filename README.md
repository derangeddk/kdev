# kdev - local development cluster with kind

## Synopsis

`kdev` is indended to help with reducing the feedback loop when developing applications that should run on Kubernetes. It can be used for both iterating on source code and kubernetes resources using eg. [Skaffold](https://skaffold.dev) or simlar.

`kdev` requires you to have these in your `PATH`:

- [Docker](https://www.docker.com) for running containers
- [Kind](https://kind.sigs.k8s.io) for creating cluster nodes
- [Skaffold](https://skaffold.dev) for installing services
- [Helm](https://helm.sh) for installing helm charts

## Commands

All `kdev` commands will search for a valid config in your current working directory or its parents.

- `kdev up`: this will create your cluster
- `kdev stop`: this will stop your current cluster
- `kdev start`: this will start your current cluster
- `kdev down`: this will delete your current cluster

- `kdev init`: this will generate a default config file in your current directory
- `kdev raw-config`: this will print your current configuration
- `kdev version`: this will print your kdev version

To start the development cluster, run `kdev up`. To stop it, run the corresponding `kdev down`.

## Default services

`kdev` installs some default services that ensures the cluster is useful:

- calico as a network CNI
- nginx-ingress-controller for HTTP/HTTPS traffic
- cert-manager for local HTTPS (see later section on importing the certificate)

## Support services

`kdev` comes with the following support services that can be installed:

- mailhog
- minio
- ory-hydra
- percona-mongodb-operator
- percona-mongodb-server
- sealed secrets
- traefik (requires uninstalling the default nginx)
- zalando-postgres-operator

Feel free to contribute more services.

### Sealed Secrets

SealedSecrets is installed with a predefinded set of keys, so you can share your shared secrets with other people using this project for local developments. The key is installed into the cluster on start.

To use `kubeseal` to seal local secrets, the following option can be used:

```bash
kubeseal --cert https://sealed-secrets.local.deranged.dk/v1/cert.pem -o yaml --secret-file=[secret.yaml]
```

### Cert Manager

There is a cert manager installed to provision SSL certificates. You can add the CA certificate to your local bundle to have proper certificate validation. See below how to add the CA certificate from the `local-deranged-dk-selfsigned-dk.crt` located in this repository.

#### Firefox on Ubuntu

- Go to `about:preferences#privacy`
- Click 'View certificates'
- Click 'Import' in the bottom
- Select the .crt file and add it

#### `curl`, and other, on Ubuntu

Run the following commands:

- `sudo cp local-deranged-dk-selfsigned-dk.crt /usr/local/share/ca-certificates/`
- `sudo update-ca-certificates --fresh`

## Container image registry

This project also creates a local container image registry, which can be used for pushing locally built container images. The registry runs directly in docker, not inside the Kind cluster.

## TODO

- add pull through caches to kubernetes setup
- add check for config change on `kdev up` by installing config as configmap and diffing it
- add script for adding certificate to trust bundles for eg. Firefox and Chrome
  - should be handled as a plugin with a config-command
- add poc for sub-commands
- support configuring localhost domain
  - default to 127-0-0-1.nip.io domain
  - detect if your DNS blocks 127.0.0.1 values
- ensure that port 80 and 443 are available before starting a cluster
- consider distributing kind and skaffold with `kdev` to avoid version issues (also support a kdev skaffold shortcut)
- add configuration option to use shared `kdev` registry or a specific one per cluster
- poc for handling ~/.kdev config directory
- temporary files should include kdev in its name for recognition, and reduce their lifetime
- detect too-many-open-files issue: https://kind.sigs.k8s.io/docs/user/known-issues/#pod-errors-due-to-too-many-open-files
- let ingress controller schedule on pre-existing label instead of specific ignress-only label
