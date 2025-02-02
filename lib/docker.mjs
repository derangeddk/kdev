const assert = async ({ name, args, image }) => {
    const container = await inspect({ name, type: 'container' });

    if (container) {
        await kill({ name });
        await remove({ name });
    };

    run({ name, args, image });
}

const run = async ({ name, args, image }) => {
    const container = await inspect({ name, type: 'container' });

    if (container) {
        await start({ name });
        return
    };

    const joinedArgs = args.join(" ");

    await $({ quote: x => x })`docker run --name=${name} --detach ${joinedArgs} ${image}`;
}

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

    if (['created', 'exited'].includes(container.State.Status)) {
        await $`docker rm ${name}`;
    } else {
        throw new Error(`Container ${name} is in an unknown state: ${container.State.Status}`);
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
    run,
    assert,
    start,
    stop,
    kill,
    remove,
    inspect,
}
