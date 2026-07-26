import fs from 'fs';
import path from 'path';

const p = path.resolve('node_modules/@midnight-ntwrk/compact-runtime/dist/runtime.js');
if (fs.existsSync(p)) {
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('exports.checkRuntimeVersion')) {
    c += `
exports.checkRuntimeVersion = function checkRuntimeVersion() { return true; };
exports.ContractState = onchain_runtime_1.ContractState;
exports.ContractOperation = onchain_runtime_1.ContractOperation;
exports.ContractMaintenanceAuthority = onchain_runtime_1.ContractMaintenanceAuthority;
exports.QueryContext = onchain_runtime_1.QueryContext;
exports.QueryResults = onchain_runtime_1.QueryResults;
exports.StateBoundedMerkleTree = onchain_runtime_1.StateBoundedMerkleTree;
exports.StateMap = onchain_runtime_1.StateMap;
exports.StateValue = onchain_runtime_1.StateValue;
exports.VmResults = onchain_runtime_1.VmResults;
exports.VmStack = onchain_runtime_1.VmStack;
exports.dummyContractAddress = onchain_runtime_1.dummyContractAddress;
`;
    fs.writeFileSync(p, c, 'utf8');
    console.log('✅ Patched @midnight-ntwrk/compact-runtime with static exports');
  }
}
