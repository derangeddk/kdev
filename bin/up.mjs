#!/usr/bin/env node
import { chalk, echo, $ } from 'zx';
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';
import kind from '../lib/kind.mjs';

$.quote = x => x;
const installService = async ({ name, dir }) => {
  if (name) echo(chalk.yellow(`Installing service { name: ${name} }`));
  await $({ cwd: dir, quiet: true })`skaffold run`;
  if (name) echo(chalk.green(`Service installed { name: ${name} }`));
};

const nodes = await kind.getNodes({ name: config.metadata.name });

if (!nodes.length) {
    echo(chalk.green(`Creating cluster { name: ${config.metadata.name} }`));

    const p = await $`kind create cluster --config=kind/${config.spec.kind.version}/cluster.yaml;`;

    if (p.exitCode !== 0) {
        echo(chalk.redBright("Could not start kind cluster - exiting"));
        process.exit(1);
    }

    for (const node of await kind.getNodes({ name: config.metadata.name })) {
        await $`docker update --restart=no ${node}`;
        await $`docker exec ${node} mkdir -p /etc/containerd/certs.d/registry.local.deranged.dk`;
        await $`docker exec -i ${node} bash -c 'echo [host.\\"http://${config.metadata.name}-registry:6000\\"] > /etc/containerd/certs.d/registry.local.deranged.dk/hosts.toml'`;
    }

    await $`skaffold config set kind-disable-load true`;
    await $`skaffold config set default-repo registry.local.deranged.dk`;
} else {
  echo(chalk.green(`Cluster already exists { name: ${config.metadata.name} }`));

  // We need to start the nodes if they are not running
  for await (const node of nodes) {
    echo(`Starting node ${chalk.green(node)}`);
    await docker.start({ name: node });
  }

  // Change context to the cluster that is already running
  echo(chalk.green(`Switching context to cluster { name: ${config.metadata.name} }`));
  try {
    await kind.setContext({ name: config.metadata.name });
  } catch (e) {
    echo(chalk.redBright(`Could not switch context to cluster { name: ${config.metadata.name} }`));
    echo(e);
    process.exit(1);
  }
  echo(chalk.green(`Context switched to cluster { name: ${config.metadata.name} }`));
}

echo(chalk.green(`Asserting registry { name: ${config.metadata.name} }`));
await docker.assert({
  name: `${config.metadata.name}-registry`,
  args: ["--restart=no", "--net=kind", `--volume=${config.metadata.name}:/var/lib/registry`, "-e REGISTRY_HTTP_ADDR=0.0.0.0:6000"],
  image: 'registry:2'
});

echo(chalk.green(`Installing services`));
const services = [];

// Add extra kind-related resources
services.push(installService({ dir: `${import.meta.dirname}/../kind` }));

// Install calico, first the operator and then the resources
const calico = async () => {
  await installService({ dir: `${import.meta.dirname}/../services/calico-operator` });
  await installService({ dir: `${import.meta.dirname}/../services/calico-resources` });
};

services.push(calico());

// Install default services
services.push(installService({ name: 'nginx-ingress-controller', dir: `${import.meta.dirname}/../services/nginx-ingress-controller` }));
services.push(installService({ name: 'cert-manager', dir: `${import.meta.dirname}/../services/cert-manager` }));

// Install custom services
if (config.spec.services) {
  services.push(...config.spec.services.map(async service => {
    await installService({ name: service, dir: `${import.meta.dirname}/../services/${service}` });
  }));
}

await Promise.all(services);

echo(chalk.blueBright("Setup complete"));
