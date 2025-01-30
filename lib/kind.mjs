$.quiet = true;

const deleteCluster = async ({ name }) => {
    return $`kind delete cluster --name ${name}`;
}

const getNodes = async ({ name }) => {
    const out = await $`kind get nodes --name ${name}`;
    return out.stdout.split("\n").filter(n => n.length);
};

export default {
    deleteCluster,
    getNodes,
}
