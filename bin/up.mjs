#!/usr/bin/env zx
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';
import kind from '../lib/kind.mjs';

$.quote = x => x;

const nodes = await kind.getNodes({ name: config.cluster.name });

if (!nodes.length) {
    echo(chalk.green(`Creating cluster { name: ${config.cluster.name} }`));

    const p = await $`kind create cluster --config=kind/1.29/cluster.yaml;`.pipe.stderr(process.stderr)

    if (p.exitCode !== 0) {
        echo(chalk.redBright("Could not start kind cluster - exiting"));
        process.exit(1);
    }

    for (const node of await kind.getNodes({ name: config.cluster.name })) {
        await $`docker update --restart=no ${node}`;
        await $`docker exec ${node} mkdir -p /etc/containerd/certs.d/registry.local.deranged.dk`;
        await $`docker exec -i ${node} bash -c 'echo [host.\\"http://${config.registry.name}:6000\\"] > /etc/containerd/certs.d/registry.local.deranged.dk/hosts.toml'`;
    }

    const skaffoldConfigKindDisableLoad = $`skaffold config set kind-disable-load true`;
    const skaffoldConfigDefaultRepo = $`skaffold config set default-repo registry.local.deranged.dk`;
}

echo(chalk.green(`Ensuring registry { name: ${config.registry.name} }`));
await docker.assert({
  name: config.registry.name,
  args: ["--restart=no", "--net=kind", `--volume=${config.registry.name}:/var/lib/registry`, "-e REGISTRY_HTTP_ADDR=0.0.0.0:6000"],
  image: 'registry:2'
});

// Add extra kind-related resources
const kindExtraResources = $({ cwd: 'kind' })`skaffold run`;

// Install calico, first the operator and then the resources
const calico = (async () => {
  await $({ cwd: 'applications/calico' })`skaffold run --filename skaffold-operator.yaml`;
  await $({ cwd: 'applications/calico' })`skaffold run --filename skaffold-resources.yaml`;
})();

// Install sealed secrets primed with pre-defined key
const sealedSecrets =  $({ cwd: 'applications/sealed-secrets' })`skaffold run`;

// Install cert-manager primed with pre-defined key
const certManager = $({ cwd: 'applications/cert-manager' })`skaffold run`;

// Install nginx-ingress-controller
const nginxIngressController = $({ cwd: 'applications/nginx-ingress-controller' })`skaffold run`;

// Install mongodb-operator
const mongodbOperator = $({ cwd: 'applications/mongodb-operator' })`skaffold run`;


await Promise.all([
  kindExtraResources,
  calico,
  sealedSecrets,
  certManager,
  nginxIngressController,
  mongodbOperator,
]);

echo("Setup complete");
