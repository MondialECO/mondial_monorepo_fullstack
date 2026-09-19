const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const child = spawn('npm', ['run', 'dev', '--', '-p', '3000'], {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => console.error('Frontend spawn error:', err));
child.on('exit', (code) => console.log('Frontend exited with code:', code));
