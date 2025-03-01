#!/usr/bin/env node

process.env.FORCE_COLOR='1'

const args = process.argv.slice(2);
const command = args.shift();

if (!command) {
    console.error('No command provided.');
    process.exit(1);
}

await import(`./${command}.mjs`)
.then(({ default: cmd }) => cmd(...args))
.catch(e => {
    console.error(e);
    process.exit(1);
});
