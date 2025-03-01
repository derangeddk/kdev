#!/usr/bin/env node
import { chalk, echo } from 'zx';
import config from '../lib/config.mjs';

echo(chalk.green('Printing the raw kdev config:'));
echo(JSON.stringify(config, null, 4));
