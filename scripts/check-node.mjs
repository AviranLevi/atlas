#!/usr/bin/env node
const REQUIRED_MAJOR = 24;
const [major] = process.versions.node.split('.').map(Number);

if (major < REQUIRED_MAJOR) {
  const v = process.versions.node;
  const r = '\x1b[0m';   // reset
  const red = '\x1b[31m';
  const bold = '\x1b[1m';
  const yellow = '\x1b[33m';

  console.error(`
${red}${bold}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ⚠️  UNSUPPORTED NODE.JS VERSION                             ║
║                                                              ║
║   Atlas requires Node.js ${REQUIRED_MAJOR} or later.                       ║
║   You are running: v${v.padEnd(40)}║
║                                                              ║
║   Upgrade:  https://nodejs.org                               ║
║   With nvm: nvm install ${REQUIRED_MAJOR} && nvm use ${REQUIRED_MAJOR}                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${r}
`);
  process.exit(1);
}
