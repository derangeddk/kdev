#!/usr/bin/env zx
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';

const nodes = (await $`kind get nodes --name ${config.cluster.name}`).stdout.split("\n").filter(n => n.length);

if (!nodes.length) {
  echo(chalk.red(`No nodes to stop`));
  process.exit();
}

for await (const node of nodes) {
  echo(`Stopping node ${chalk.red(node)}`);
  await docker.stop({ name: node });
}

if (argv.all) {
  echo(`Stopping registry ${chalk.red(config.registry.name)}`);
  await docker.stop({ name: config.registry.name });
}
