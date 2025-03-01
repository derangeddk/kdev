import { sleep, $ } from "zx";

const deleteCluster = async ({ name }) => {
    return $`kind delete cluster --name ${name}`;
}

const getNodes = async ({ name }) => {
    const out = await $({ quiet: true })`kind get nodes --name ${name}`;
    return out.stdout.split("\n").filter(n => n.length);
};

const setContext = async ({ name, attempts = 5 }) => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        if (await $`kind export kubeconfig --name ${name}`.exitCode === 0) {
            break;
        } else if(attempt === attempts) {
            // TODO - add correct error from command
            throw new Error("Could not set context");
        }
        await sleep(5000)
    }
}

export default {
    deleteCluster,
    getNodes,
    setContext,
}
