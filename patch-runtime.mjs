import fs from 'fs';
import path from 'path';

const p = path.resolve('node_modules/@midnight-ntwrk/compact-runtime/dist/runtime.js');
if (fs.existsSync(p)) {
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('exports.checkRuntimeVersion')) {
    c += '\nexports.checkRuntimeVersion = function checkRuntimeVersion() { return true; };\n';
    fs.writeFileSync(p, c, 'utf8');
    console.log('✅ Patched @midnight-ntwrk/compact-runtime with checkRuntimeVersion export');
  }
}
