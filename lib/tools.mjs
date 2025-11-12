import { echo, fs, chalk, os, path, cd, $, question } from "zx";
import { select, Separator } from '@inquirer/prompts';
import { isYes } from "./utils.mjs";

// this is called on every command to verify that the required tools are available with the correct version
export default async () => {
    const tools = [
        {
            // https://github.com/jqlang/jq/releases
            name: 'jq',
            expectedVersion: 'jq-1.7.1',
            versionCommand: "jq --version",
            downloadCommand: `curl -sL https://github.com/jqlang/jq/releases/download/VERSION/jq-linux-amd64 > jq`,
        },
        {
            // https://kubernetes.io/releases
            name: 'kubectl',
            expectedVersion: 'v1.34.0',
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
            expectedVersion: 'v2.16.1',
            versionCommand: 'skaffold version --output {{.Version}}',
            downloadCommand: `curl -sL https://storage.googleapis.com/skaffold/releases/VERSION/skaffold-linux-amd64 > skaffold`,
        },
    ];

    const results = await Promise.all(tools.map(verify));

    const missingTools = results.filter(result => result.status === 'missing');
    const wrongVersionTools = results.filter(result => result.status === 'wrong-version');

    if (wrongVersionTools.length) {
        echo(chalk.redBright(`Some tools are installed, but the wrong version:`));
        for (const tool of wrongVersionTools) {
            echo(chalk.redBright(`- ${tool.name}: installed version ${tool.currentVersion}, expected version ${tool.expectedVersion}`));
        }

        // exit if some tools are installed outside of home directory
        if (wrongVersionTools.filter(tool => !tool.filePath.startsWith(os.homedir())).length) {
            throw new Error('Some tools are installed outside of your home directory, please update them manually');
        }

        const answer = await question('Do you want to update them? [Y/n]');

        if (isYes(answer, { defaultValue: true })) {
            for (const tool of wrongVersionTools) {
                echo(chalk.blueBright(`Installing ${tool.name}, version ${tool.expectedVersion}`));

                await install(tool);
                const currentVersion = await getCurrentVersion(tool);

                if (!currentVersion) {
                    throw new Error(`Could not get version of ${tool.name}`);
                }

                if (currentVersion === tool.expectedVersion) {
                    echo(chalk.green(`${tool.name} is now up to date, version ${await getCurrentVersion(tool)}`));
                } else {
                    throw new Error(`${tool} installation failed, version ${await getCurrentVersion(tool)} installed, expected ${tool.expectedVersion}`);
                }
            }
        } else {
            echo(chalk.redBright('Stopping'));
        }
    }

    if (missingTools.length) {
        echo(chalk.redBright(`Some tools are missing: ${missingTools.map(tool => tool.name).join(', ')}`));

        echo(chalk.grey('Finding potential install directories in your $PATH ...'));
        const directories = findDirectoriesInPath();
        const path = await select({
            message: 'Where do you want to install them?',
            loop: false,
            choices: [...directories, new Separator('If you want to install them somewhere else, please add the directory to your $PATH first')],
        });

        for (const tool of missingTools) {
            if (results[tools.indexOf(tool)] !== 'ok') {
                echo(chalk.blueBright(`Installing ${tool.name}, version ${tool.expectedVersion}`));

                await install({ ...tool, filePath: `${path}/${tool.name}` });
                const currentVersion = await getCurrentVersion(tool);

                if (!currentVersion) {
                    throw new Error(`Failed to install ${tool.name} - is ~/bin in your $PATH? If not, append this to your .bashrc, and restart your shell: export PATH=$PATH:~/bin`);
                }

                if (currentVersion === tool.expectedVersion) {
                    echo(chalk.green(`${tool.name} is now up to date, version ${await getCurrentVersion(tool)}`));
                } else {
                    throw new Error(`${tool} installation failed, version ${await getCurrentVersion(tool)} installed, expected ${tool.expectedVersion}`);
                }
            }
        }
    }
}

const verify = async (spec) => {
    const { name, expectedVersion } = spec;

    const binary = `${os.homedir()}/bin/${name}`;
    if (! await fileExists(binary)) {
        return { ...spec, status: 'missing' };
    }

    const currentVersion = await getCurrentVersion(spec);
    if (currentVersion != expectedVersion) {
        const filePath = $.sync`which ${name}`.valueOf();
        return { ...spec, status: 'wrong-version', filePath, currentVersion };
    }

    return { ...spec, status: 'ok' };
}

const install = async ({ name, expectedVersion, downloadCommand, filePath }) => {
    const cwd = process.cwd();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), name));

    cd(tmpDir);

    await runWithNoQuote(downloadCommand.replace(/VERSION/g, expectedVersion));

    $.sync`chmod 700 ${name}`;
    $.sync`cp ${name} ${filePath}`;
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

const findDirectoriesInPath = () => {
    const path = process.env.PATH;
    const directories = path.split(':');

    // expand directories to full path and find suggestions on where to install missing tools
    return directories
        .map(directory => directory.replace(/^~/, os.homedir()))
        .filter(directory => directory.startsWith(os.homedir()))
        .sort((a, b) => a.length - b.length);
}
