#!/usr/bin/env zx
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';

const answer = await question(`Are you sure you want to stop ${chalk.red(config.cluster.name)}? (N/y) `)

if (answer !== "y") {
    echo(`Not continuing`);
    process.exit(0);
}

echo(`Stopping cluster ${chalk.red(config.cluster.name)}`);
await $`kind delete cluster --name ${config.cluster.name}`;

if (argv.all) {
    await docker.kill({ name: config.registry.name });
    await docker.remove({ name: config.registry.name });
}
