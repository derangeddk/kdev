#!/usr/bin/env node
import { echo, chalk } from 'zx';
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';
import kind from '../lib/kind.mjs';

const nodes = await kind.getNodes({ name: config.metadata.name });

if (!nodes.length) {
  echo(chalk.red(`Cluster does not exist { name: ${config.metadata.name} }`));
  process.exit();
}

for await (const node of nodes) {
  echo(`Stopping node ${chalk.red(node)}`);
  await docker.stop({ name: node });
}

echo(`Stopping registry ${chalk.red(config.metadata.name)}`);
await docker.stop({ name: config.metadata.name });
