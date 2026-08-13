const major = Number(process.version.slice(1).split('.')[0]);

if (major === 20) {
  process.exit(0);
}

console.error('');
console.error(`Expo mobile needs Node 20.x (current: ${process.version}).`);
console.error('Node 22+ breaks Expo with ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING.');
console.error('');
console.error('Fix (pick one):');
console.error('  nvm:  nvm install 20 && nvm use');
console.error('  fnm:  fnm install 20.18.1 && fnm use');
console.error(
  '  brew: brew install node@20 && export PATH="/opt/homebrew/opt/node@20/bin:$PATH"',
);
console.error('');
process.exit(1);
