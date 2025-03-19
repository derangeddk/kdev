import { echo, fs, chalk, os, path, cd, $, question } from "zx";
// import config from "./config.mjs";
import { isYes } from "./utils.mjs";

// this is called on every command to verify that the required tools are available with the correct version
export default async () => {
    const tools = [
        {
            // https://kubernetes.io/releases
            name: 'kubectl',
            expectedVersion: 'v1.30.10',
            versionCommand: "kubectl version --client=true -ojson | jq -jr .clientVersion.gitVersion",
            downloadCommand: 'curl -sL https://dl.k8s.io/release/VERSION/bin/linux/amd64/kubectl > kubectl',
        },
        {
            // https://github.com/helm/helm/releases
            name: 'helm',
            expectedVersion: 'v3.17.2',
            versionCommand: `helm version --template {{.Version}}`,
            downloadCommand: `curl -sL https://get.helm.sh/helm-VERSION-linux-amd64.tar.gz | tar -xzO linux-amd64/helm > helm`,
        },
        {
            // https://github.com/kubernetes-sigs/kind/releases
            name: 'kind',
            expectedVersion: 'v0.27.0',
            versionCommand: "kind version | awk '{printf $2}'",
            downloadCommand: `curl -sL https://github.com/kubernetes-sigs/kind/releases/download/VERSION/kind-linux-amd64 > kind`,
        },
        {
            // https://github.com/GoogleContainerTools/skaffold/releases
            name: 'skaffold',
            expectedVersion: 'v2.14.1',
            versionCommand: 'skaffold version --output {{.Version}}',
            downloadCommand: `curl -sL https://storage.googleapis.com/skaffold/releases/VERSION/skaffold-linux-amd64 > skaffold`,
        },
    ];

    const results = await Promise.all(tools.map(assertTool));

    if (results.includes('missing') || results.includes('wrong-version')) {
        const answer = await question(chalk.yellowBright('Some tools are missing or have the wrong version. Do you want to install them to ~/bin? [Y/n]: '));
        if (isYes(answer, { defaultValue: true })) {
            for (const tool of tools) {
                if (results[tools.indexOf(tool)] !== 'ok') {
                    echo(chalk.blueBright(`Installing ${tool.name}, version ${tool.expectedVersion}`));

                    await install(tool);
                    const currentVersion = await getCurrentVersion(tool);

                    if (!currentVersion) {
                        throw new Error(`Failed to install ${tool.name} - is ~/bin in your PATH?`);
                    }

                    if (currentVersion === tool.expectedVersion) {
                        echo(chalk.green(`${tool.name} is now up to date, version ${await getCurrentVersion(tool)}`));
                    } else {
                        throw new Error(`${tool} installation failed, version ${await getCurrentVersion(tool)} installed, expected ${tool.expectedVersion}`);
                    }
                }
            }
        } else {
            echo(chalk.red('Some tools are missing or have the wrong version. Exiting.'));
            process.exit(1);
        }
    }
}


const assertTool = async (spec) => {
    const { name, expectedVersion } = spec;

    const binary = `${os.homedir()}/bin/${name}`;
    if (! await fileExists(binary)) {
        // if (config.verbose) echo(chalk.yellow(`${name} not found in path`));
        return 'missing';
    }

    const currentVersion = await getCurrentVersion(spec);
    if (currentVersion != expectedVersion) {
        // if (config.verbose) echo(chalk.yellow(`${name} version is ${currentVersion}, expected ${expectedVersion}.`));
        return 'wrong-version';
    }

    // if (config.verbose) echo(chalk.green(`${name} is up to date, version ${await getCurrentVersion(spec)}`));
    return 'ok';
}

const install = async ({ name, expectedVersion, downloadCommand }) => {
    const cwd = process.cwd();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), name));

    cd(tmpDir);

    await runWithNoQuote(downloadCommand.replace(/VERSION/g, expectedVersion));

    await $`chmod 700 ${name}`;
    await $`cp ${name} ${os.homedir()}/bin/${name}`;
    cd(cwd)

    await fs.rm(tmpDir, { recursive: true });
}

const fileExists = async (file) => {
    return await $`[[ -f ${file} ]]`.exitCode == 0
}

const getCurrentVersion = async ({ versionCommand }) => {
    const versionProcess = await runWithNoQuote(versionCommand);
    return versionProcess.stdout.trim();
}

const runWithNoQuote = async (command) => {
    const oldQoute = $.quote;
    $.quote = x => x;
    const result = await $`${command}`;
    $.qoute = oldQoute;
    return result;
}
