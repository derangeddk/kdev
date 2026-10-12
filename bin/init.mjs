#!/usr/bin/env node
import { echo, question, fs, YAML } from 'zx';
import { isYes } from '../lib/utils.mjs';

const answer = await question("Do you want to create a default config file here? [y/N]: ");

const defaultConfig = {
    apiVersion: "kdev.deranged.dk/v1",
    kind: "Cluster",
    metadata: {
        name: "local-deranged-dk",
    },
    spec: {
        kind: {
            kubernetesVersion: "1.37",
        },
        config: {
            domain: "local.deranged.dk",
            registry: "registry.local.deranged.dk",
            ingressService: "nginx-ingress-controller.default.svc.cluster.local",
        },
        plugins: [

        ],
        services: [

        ],
    },
};

if (isYes(answer, { defaultValue: false })) {
    fs.writeFileSync("kdevconfig.yaml", YAML.stringify(defaultConfig));
} else {
    echo("No config file created");
}
