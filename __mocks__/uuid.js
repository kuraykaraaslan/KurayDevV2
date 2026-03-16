// CJS shim for uuid (pure ESM package) used in Jest tests
let counter = 0
module.exports = {
  v4: () => `test-uuid-${++counter}`,
  v1: () => `test-uuid-v1-${++counter}`,
}
