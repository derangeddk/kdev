#!/usr/bin/env node
import { echo } from 'zx';

const pkg = await import('../package.json', { with: { type: "json" } });

echo(`kdev v${pkg.default.version}`);
