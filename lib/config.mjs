let config;

// load the config file recursively back to root folder
let currentPath = process.cwd();
while (currentPath !== "/") {
    if (fs.existsSync(`${currentPath}/kdevconfig.yaml`)) {
        const configPath = `${currentPath}/kdevconfig.yaml`;
        config = YAML.parse(fs.readFileSync(configPath).toString());

        // verify the api version and kind of the config file
        if (config.apiVersion === "kdev.deranged.dk/v1" && config.kind === "Cluster") {
            echo(chalk.grey(`Using kdev config file: ${configPath}`));
            break;
        }
    }

    currentPath = currentPath.replace(/\/[^/]+$/, "");
}

if (!config) throw new Error("Config file not found");

export default config;
