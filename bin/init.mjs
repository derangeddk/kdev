#!/usr/bin/env node
import { echo, question, fs, YAML } from 'zx';

echo("Welcome to the kdev config initializer");

const answer = await question("Do you want to create a default config file here? [y/N]: ");

const defaultConfig = {
    apiVersion: "kdev.deranged.dk/v1",
    kind: "Cluster",
    metadata: {
        name: "local-deranged-dk",
    },
    spec: {
        kind: {
            version: "1.30"
        },
    },
};

if (answer === "y") {
    fs.writeFileSync("kdevconfig.yaml", YAML.stringify(defaultConfig));
} else {
    echo("No config file created");
}
