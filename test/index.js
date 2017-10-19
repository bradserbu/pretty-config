const assert = require('assert')
const prettyConfig = require('../src/index.js')

prettyConfig('hela')
  .then((config) => {
    assert.strictEqual(typeof config, 'object')
    assert.strictEqual(config.extends, 'tunnckocore')
    console.log(config)
    console.log('test passed!')
  })
  .catch(console.error)
