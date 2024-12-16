$.quiet = true;

const start = async ({ name }) => {
    const container = await inspect({ name, type: 'container' });

    if (!container) return;

    if (container.State.Status === 'exited') {
        await $`docker start ${name}`;
    }
};

const stop = async ({ name }) => {
    const container = await inspect({ name, type: 'container' });

    if (!container) return;

    if (container.State.Status === 'running') {
        await $`docker stop ${name}`;
    }
};

const kill = async ({ name }) => {
    const container = await inspect({ name, type: 'container' });

    if (!container) return;

    if (container.State.Status === 'running') {
        await $`docker kill ${name}`;
    }
};

const remove = async ({ name }) => {
    const container = await inspect({ name, type: 'container' });

    if (!container) return;

    if (container.State.Status === 'exited') {
        await $`docker rm ${name}`;
    }
};

const inspect = async ({ name, type }) => {
    let p;
    try {
        const typeOption = type ? `--type=${type}` : '';
        p = await $`docker inspect ${typeOption} ${name}`;
    } catch (error) {
        if (type === 'container' && error.message.startsWith(`Error response from daemon: No such container: ${name}`)) return;
        if (error.message.startsWith(`Error response from daemon: ${type} ${name} not found`)) return;

        echo("Unknown error happened: " + error)
        return error;
    }

    return p.json()[0];
}

export default {
    start,
    stop,
    kill,
    remove,
    inspect,
}
