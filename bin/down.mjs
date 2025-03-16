#!/usr/bin/env node
import { chalk, echo, question } from "zx";
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';
import kind from '../lib/kind.mjs';
import { isYes } from "../lib/utils.mjs";

const nodes = await kind.getNodes({ name: config.metadata.name });

if (!nodes.length) {
  echo(chalk.red(`Cluster does not exist { name: ${config.metadata.name} }`));

  if (await docker.inspect({ type: 'container', name: config.metadata.name })) {
    echo(`Registry exists - deleting it.`);
    await docker.kill({ name: config.metadata.name });
    await docker.remove({ name: config.metadata.name });
  }

  process.exit(0);
}

const answer = await question(`Are you sure you want to delete the cluster ${chalk.red(config.metadata.name)}? (N/y) `)

if (!isYes(answer, { defaultValue: false })) {
    echo(`Not continuing`);
    process.exit(0);
}

echo(`Deleting cluster ${chalk.red(config.metadata.name)}`);
await kind.deleteCluster({ name: config.metadata.name });

echo(`Deleting registry ${chalk.red(config.metadata.name)}`);
await docker.kill({ name: config.metadata.name });
await docker.remove({ name: config.metadata.name });
