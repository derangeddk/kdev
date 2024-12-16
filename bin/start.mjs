#!/usr/bin/env zx
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';

const nodes = (await $`kind get nodes --name ${config.cluster.name}`).stdout.split("\n").filter(n => n.length);

if (!nodes.length) {
  echo(chalk.red(`No nodes to start`));
  process.exit();
}

for await (const node of nodes) {
  echo(`Starting node ${chalk.green(node)}`);
  await docker.start({ name: node });
}

if (argv.all) {
  echo(`Starting registry ${chalk.green(config.registry.name)}`);
  await docker.start({ name: config.registry.name });
}
