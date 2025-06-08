#!/usr/bin/env node
import { chalk, echo, $, fs, YAML } from 'zx';
import config from '../lib/config.mjs';
import docker from '../lib/docker.mjs';
import kind from '../lib/kind.mjs';

const packageRoot = `${import.meta.dirname}/..`;

$.quote = x => x;
const installService = async ({ name, dir }) => {
  if (name) echo(chalk.yellow(`Installing service { name: ${name} }`));
  await $({ cwd: dir, quiet: true })`skaffold run`;
  if (name) echo(chalk.green(`Service installed { name: ${name} }`));
};

const installPlugin = async (plugin) => {
  // if plugin is a string, convert it to an object
  if (typeof plugin === 'string') plugin = { url: plugin }

  if (plugin.url) {
    const [scheme, path] = plugin.url.split('://');
    plugin.scheme = scheme;
    plugin.path = path;
    if (!plugin.name) plugin.name = path.split('/').pop();
  }

  // if the plugin is a builtin plugin, we need to set the path to the correct location
  // this way, we handle built in plugins as if they were file-scheme plugins
  if (plugin.scheme === 'builtin') {
    plugin.scheme = 'file';
    plugin.path = `plugins/${plugin.path}/index.sh`;
  }

  const { name, scheme, config: pluginConfig={}, silent=false } = plugin;
  if (name && !silent) echo(chalk.yellow(`Installing plugin { name: ${name} }`));

  if (scheme === 'file') {
    const { path } = plugin;
    // await $`${packageRoot}/${path} install --config='${JSON.stringify(pluginConfig)}' --clusterName='${config.metadata.name}'`;
    await $`${packageRoot}/${path} install --config='${JSON.stringify(pluginConfig)}' --clusterName='${config.metadata.name}'`.pipe(process.stdout);

    if (name && !silent) echo(chalk.green(`Plugin installed { name: ${name} }`));
    return;
  }

  echo(chalk.redBright(`type not implemented { type: ${scheme} }`));
  return;
};

const installChart = async ({ name, remoteChart, remoteRepo, version, values = {}}) => {
  echo(chalk.yellow(`Installing chart { name: ${name}, remoteChart: ${remoteChart || name}, ${remoteRepo ? `remoteRepo: ${remoteRepo}, ` : ''} version: ${version} }`));

  const temporaryFileName = `.values-${name}-${version}.yaml`;
  fs.writeFileSync(temporaryFileName, YAML.stringify(values));

  try {
    await $({ quiet: true })`helm upgrade --install --values "${temporaryFileName}" ${name} ${remoteChart || name} ${remoteRepo ? `--repo ${remoteRepo}` : ''} --version ${version}`;
  } catch (error) {
    echo(chalk.redBright(`Could not install chart { name: ${name} }`));
    return echo(error);
  } finally {
    fs.rmSync(temporaryFileName);
  }

  echo(chalk.green(`Chart installed { name: ${name} }`));
};

const nodes = await kind.getNodes({ name: config.metadata.name });

if (!nodes.length) {
    echo(chalk.green(`Creating cluster { name: ${config.metadata.name} }`));

    const p = await $`kind create cluster --name ${config.metadata.name} --config=${import.meta.dirname}/../kind/${config.spec.kind.version}/cluster.yaml;`;

    if (p.exitCode !== 0) {
        echo(chalk.redBright("Could not start kind cluster - exiting"));
        process.exit(1);
    }

    for (const node of await kind.getNodes({ name: config.metadata.name })) {
        await $`docker update --restart=no ${node}`;
        await $`docker exec ${node} mkdir -p /etc/containerd/certs.d/${config.spec.config.registry}`;
        await $`docker exec -i ${node} bash -c 'echo [host.\\"http://${config.metadata.name}-registry:6000\\"] > /etc/containerd/certs.d/${config.spec.config.registry}/hosts.toml'`;
    }

    await $`skaffold config set kind-disable-load true`;
    await $`skaffold config set default-repo ${config.spec.config.registry}`;
} else {
  echo(chalk.green(`Cluster already exists { name: ${config.metadata.name} }`));

  // We need to start the nodes if they are not running
  for await (const node of nodes) {
    echo(`Starting node ${chalk.green(node)}`);
    await docker.start({ name: node });
  }

  // Change context to the cluster that is already running
  echo(chalk.yellow(`Switching context to cluster { name: ${config.metadata.name} }`));
  try {
    await kind.setContext({ name: config.metadata.name });
  } catch (e) {
    echo(chalk.redBright(`Could not switch context to cluster { name: ${config.metadata.name} }`));
    echo(e);
    process.exit(1);
  }
  echo(chalk.green(`Context switched to cluster { name: ${config.metadata.name} }`));
}

echo(chalk.green(`Asserting registry { name: ${config.metadata.name}-registry }`));
await docker.assert({
  name: `${config.metadata.name}-registry`,
  args: ["--restart=no", "--net=kind", `--volume=${config.metadata.name}:/var/lib/registry`, "-e REGISTRY_HTTP_ADDR=0.0.0.0:6000"],
  image: 'registry:2'
});

if (config.spec.kind.version !== '1.30') {
  echo(chalk.green(`Installing CNI plugin`));
  await installPlugin(config.spec.kind.cniPlugin || 'builtin://cilium');
}

echo(chalk.green(`Installing services`));
const services = [];

// Add extra kind-related resources
await installPlugin({ url: 'builtin://extra-kind-resources', config: config.spec.config, silent: true });

// for 1.30 we install calico
if (config.spec.kind.version === '1.30') {
  echo(chalk.yellow(`Using calico for networking`));

  // Install calico, first the operator and then the resources
  services.push(async () => {
    await installService({ dir: `${import.meta.dirname}/../services/calico-operator` });
    await installService({ dir: `${import.meta.dirname}/../services/calico-resources` });
  });
}

// for 1.30 we install nginx ingress controller, but in the future, users install their own or via a plugin
if (config.spec.kind.version === '1.30') {
  services.push(installService({ name: 'nginx-ingress-controller', dir: `${import.meta.dirname}/../services/nginx-ingress-controller` }));
}

// Install custom services
if (config.spec.services) {
  services.push(...config.spec.services.map(async service => {
    await installService({ name: service, dir: `${import.meta.dirname}/../services/${service}` });
  }));
}

await Promise.all(services);


// Install custom plugins
if (config.spec.plugins) {
  const plugins = config.spec.plugins.map(installPlugin);
  await Promise.all(plugins);
}

// Install charts
if (config.spec.charts) {
  const charts = config.spec.charts.map(installChart);
  await Promise.all(charts);
}

echo(chalk.blueBright("Setup complete"));
