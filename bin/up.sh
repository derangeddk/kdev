#!/usr/bin/env bash

# shellcheck disable=SC1091
# disable follow source rule

set -o errexit

source constants.sh

# 1. Create registry container unless it already exists
if [ "$(docker inspect -f '{{.State.Running}}' "$REGISTRY" 2>/dev/null || true)" != 'true' ]; then
  docker run -d --restart=always --name "$REGISTRY" \
    --net kind -p 127.0.0.1:5000:5000 \
    -v registry:/var/lib/registry \
    registry:2
fi

# 2. Create kind cluster
if ! kind create cluster --config=kind/1.29/cluster.yaml; then
  echo "Could not start kind cluster - exiting";
  exit 1;
fi

# 3. Configure nodes
for node in $(kind get nodes --name "$KIND_NAME"); do
  # dont restart kind cluster automatically
  docker update --restart=no "${node}"

  # configure to be able to pull from local container registry
  docker exec "${node}" mkdir -p "/etc/containerd/certs.d/localhost:5000"
  cat <<EOF | docker exec -i "${node}" cp /dev/stdin "/etc/containerd/certs.d/localhost:5000/hosts.toml"
[host."http://"$REGISTRY":5000"]
EOF
done


# add extra kind-related resources
# - registry hosting configuration
# - local DNS resolution for *.local.deranged.dk
cd kind; skaffold run; cd ..;

# install calico
cd applications/calico; skaffold run --filename skaffold-operator.yaml; cd ../..;
cd applications/calico; skaffold run --filename skaffold-resources.yaml; cd ../..;

# install sealed secrets primed with pre-defined key
cd applications/sealed-secrets; skaffold run; cd ../..;

# install cert-manager primed with pre-defined key
cd applications/cert-manager; skaffold run; cd ../..;

echo "Setting global skaffold configuration"
skaffold config set kind-disable-load true
skaffold config set default-repo localhost:5000
