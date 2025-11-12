#!/usr/bin/env node
import { chalk, echo } from 'zx';
import assertTools from '../lib/tools.mjs';

process.on('warning', (warning) => {
    echo(chalk.orange('A warning was emitted'));
    echo(warning);
});

const args = process.argv.slice(2);
const command = args.shift();

if (!command) {
    console.error('No command provided.');
    process.exit(1);
}

if (command !== "tools") await assertTools();

try {
    await import(`./${command}.mjs`);
} catch (error) {
    echo(chalk.red('An error happened'));
    echo(error);
    process.exit(1);
}
