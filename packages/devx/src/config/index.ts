import { homedir } from 'os';
import { join } from 'path';
import type { GlobalConfig } from './types';
import { GlobalConfigSchema } from './types';
import { existsSync, mkdirSync } from 'fs';

const DEVX_DIR = join(homedir(), '.devx');
