# Local Development Cluster with Kind

## Synopsis
This project is indended to help with reducing the feedback loop when developing applications that should run on Kubernetes. It can be used for both iterating on source code and kubernetes objects using eg. [Skaffold](https://skaffold.dev) or simlar.

The project here is based on [Kind](https://kind.sigs.k8s.io/), which is a prerequisite before starting the cluster.


## Usage
To start the development cluster, run `./up.sh`. To stop it, run the corresponding `./down.sh`.


## Details
This project also installs a local container image registry, which can be used for pushing locally built container images. The registry runs directly in docker, not inside the Kind cluster.
