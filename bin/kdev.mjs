#!/usr/bin/env node

process.env.FORCE_COLOR='1'

const args = process.argv.slice(2);
const command = args.shift();

if (!command) {
    console.error('No command provided.');
    process.exit(1);
}

await import(`./${command}.mjs`);
