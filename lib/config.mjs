
const config = YAML.parse(fs.readFileSync("config.yaml").toString());

config.registry = { name: `${config.cluster.name}-registry` };

export default config;
