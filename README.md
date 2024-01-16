# Local Development Cluster with Kind

## Synopsis
This project is indended to help with reducing the feedback loop when developing applications that should run on Kubernetes. It can be used for both iterating on source code and kubernetes objects using eg. [Skaffold](https://skaffold.dev) or simlar.

The project here is based on [Kind](https://kind.sigs.k8s.io/), which is a prerequisite before starting the cluster.


## Usage
To start the development cluster, run `./up.sh`. To stop it, run the corresponding `./down.sh`.


## Details
This project also installs a local container image registry, which can be used for pushing locally built container images. The registry runs directly in docker, not inside the Kind cluster.


## SSL Certificates
The cluster comes with a pre-configured cert-manager and the root CA can be added to your local browser. The CA certificate in PEM format is located in the root of the project: `kind-dernaged-selfsigned-ca.crt`.

### Firefox
It can be imported into Firefox by going to: **about:preferences#privacy -> Certificates -> View Certificates... -> Import...**

Other browsers is a #TODO
