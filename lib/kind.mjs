const deleteCluster = async ({ name }) => {
    return $({ quiet: true })`kind delete cluster --name ${name}`;
}

const getNodes = async ({ name }) => {
    const out = await $({ quiet: true })`kind get nodes --name ${name}`;
    return out.stdout.split("\n").filter(n => n.length);
};

export default {
    deleteCluster,
    getNodes,
}
