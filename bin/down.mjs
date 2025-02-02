#!/usr/bin/env zx
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';
import kind from '../lib/kind.mjs';

const nodes = await kind.getNodes({ name: config.cluster.name });

if (!nodes.length) {
  echo(chalk.red(`Cluster does not exist { name: ${config.cluster.name} }`));

  if (await docker.inspect({ type: 'container', name: config.registry.name })) {
    echo(`Registry exists - deleting it.`);
    await docker.kill({ name: config.registry.name });
    await docker.remove({ name: config.registry.name });
  }

  process.exit(0);
}

const answer = await question(`Are you sure you want to delete the cluster ${chalk.red(config.cluster.name)}? (N/y) `)

if (answer !== "y") {
    echo(`Not continuing`);
    process.exit(0);
}

echo(`Deleting cluster ${chalk.red(config.cluster.name)}`);
await kind.deleteCluster({ name: config.cluster.name });

echo(`Deleting registry ${chalk.red(config.registry.name)}`);
await docker.kill({ name: config.registry.name });
await docker.remove({ name: config.registry.name });
