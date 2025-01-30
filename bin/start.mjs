#!/usr/bin/env zx
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';
import kind from '../lib/kind.mjs';

const nodes = await kind.getNodes({ name: config.cluster.name });

if (!nodes.length) {
  echo(chalk.red(`Cluster does not exist { name: ${config.cluster.name} }`));
  process.exit();
}

for await (const node of nodes) {
  echo(`Starting node ${chalk.green(node)}`);
  await docker.start({ name: node });
}

echo(`Starting registry ${chalk.green(config.registry.name)}`);
await docker.start({ name: config.registry.name });
