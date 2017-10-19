function isObject (val) {
  return val && typeof val === 'object' && !Array.isArray(val)
}

function esmInteropRequire (id) {
  const ex = require('@std/esm')(module)(id)
  return isObject(ex) && 'default' in ex ? ex['default'] : ex
}

module.exports = esmInteropRequire('./index.mjs')
