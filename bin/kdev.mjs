#!/usr/bin/env zx

process.env.FORCE_COLOR='1'

const args = process.argv.slice(3);
const command = args.shift();

if (!command) {
    console.error('No command provided.');
    process.exit(1);
}

const commandPath = [__dirname, command].join("/");
const script = [commandPath, ...args].join(" ");

await $()`${script}`.pipe(process.stdout);
