# Local Development Cluster with Kind

## Synopsis
This project is indended to help with reducing the feedback loop when developing applications that should run on Kubernetes. It can be used for both iterating on source code and kubernetes objects using eg. [Skaffold](https://skaffold.dev) or simlar.

The project here is based on [Kind](https://kind.sigs.k8s.io/), which is a prerequisite before starting the cluster.


## Usage
To start the development cluster, run `./up.sh`. To stop it, run the corresponding `./down.sh`.

## Support applications
The cluster comes with the following support applications that can be installed:

### Ingress controllers
- Traefik
- Nginx Ingress Controller


### Sealed Secrets
SealedSecrets is installed with a predefinded set of keys, so you can share your shared secrets with other people using this project for local developments. The key is installed into the cluster on start.

To use `kubeseal` to seal local secrets, the following option can be used:
```
kubeseal --cert https://sealed-secrets.local.deranged.dk/v1/cert.pem -o yaml --from-file=[secret.yaml]
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

### Calico
Calico is installed to allow building and testing fine grained network policies. Testing these locally makes building them easier.


## Registry
This project also a local container image registry, which can be used for pushing locally built container images. The registry runs directly in docker, not inside the Kind cluster.

## TODO
- add pull through cache
- rewrite up.sh to zx
