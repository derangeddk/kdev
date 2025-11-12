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
  echo(`Asserting running node ${chalk.green(node)}`);
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

echo(`Asserting running registry ${chalk.green(config.metadata.name)}`);
await docker.start({ name: config.metadata.name });
