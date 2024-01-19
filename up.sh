#!/usr/bin/env bash

# shellcheck disable=SC1091
# disable follow source rule

source constants.sh

# TODO verify skaffold version perhaps even download latest
echo "Skaffold version: $(skaffold version)"

# Set some skaffold default settings
skaffold config set --global kind-disable-load true
skaffold config set --global default-repo localhost:5000


# 1. Create registry container unless it already exists
declare REGISTRY=deranged-registry
if [ "$(docker inspect -f '{{.State.Status}}' "$REGISTRY" 2>/dev/null)" == 'exited' ]; then
  echo "Registry container was stopped, starting container"
  docker start "$REGISTRY"
fi
if [ "$(docker inspect -f '{{.State.Running}}' "$REGISTRY" 2>/dev/null)" == 'running' ]; then
  echo "Registry container is running"
  ## TODO verify configuration?
fi
if [ "$(docker inspect -f '{{.State.Running}}' "$REGISTRY" 2>/dev/null)" == '' ]; then
  echo "Creating registry container"
  docker run -d --restart=always --name "$REGISTRY" \
    --net kind -p 5000:5000 \
    -v registry:/var/lib/registry \
    registry:2
fi


# 2. Create kind cluster
kind create cluster --config=spec/cluster.yaml

# 3. Configure nodes to be able to pull from local container registry
for node in $(kind get nodes --name "$KIND_NAME"); do
  docker exec "${node}" mkdir -p "/etc/containerd/certs.d/localhost:5000"
  cat <<EOF | docker exec -i "${node}" cp /dev/stdin "/etc/containerd/certs.d/localhost:5000/hosts.toml"
[host."http://deranged-registry:5000"]
EOF
done
