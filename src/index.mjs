import { resolveConfig, resolveConfigPath } from './utils.mjs'

const configFiles = [
  '.%src.json', // 1
  '.%src.yaml', // 2
  '.%src.yml', // 3
  '.%src.js', // 4
  '%s.config.js', // 5
  '.%s.config.js', // 6
  '.%src', // 7 - first try JSON, if fail to parse then fallback to YAML
  'package.json', // 8 - pkg.eslint || pkg.eslintConfig || pkg.config.eslint
]

function prettyConfig (name, options) {
  return new Promise((resolve, reject) => {
    if (typeof name !== 'string') {
      throw new TypeError('pretty-config: `name` is required argument')
    }
    if (name.length < 1) {
      throw new Error('pretty-config: expect `name` to be non-empty string')
    }

    const opts = Object.assign(
      { cwd: process.cwd(), name: name, configFiles: configFiles },
      options
    )
    const configPath = resolveConfigPath(opts)

    // we return empty object,
    // because we don't have any config
    // and no errors
    if (!configPath) {
      resolve(null)
      return
    }

    resolveConfig(opts, configPath).then(resolve, reject)
  })
}

export default prettyConfig
