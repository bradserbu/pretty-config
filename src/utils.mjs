import fs from 'fs'
import path from 'path'
import util from 'util'

import pify from 'pify'
import yaml from 'js-yaml'

function isObject (val) {
  return val && typeof val === 'object' && !Array.isArray(val)
}

function interop (ex) {
  return isObject(ex) && 'default' in ex ? ex['default'] : ex
}

function resolveConfigPath (opts) {
  const configFilepath = opts.configFiles.reduce((configPath, fp) => {
    // really, hit fs only once, we don't care
    // if there is more existing config files,
    // we care about the first found one
    if (configPath.length > 0) {
      return configPath
    }

    const resolvePath = (filePath) => path.resolve(opts.cwd, filePath)

    if (fp === 'package.json') {
      fp = resolvePath(fp)
    } else {
      fp = resolvePath(util.format(fp, opts.name))
    }

    if (fs.existsSync(fp)) {
      configPath += fp
    }

    return configPath
  }, '')

  return configFilepath
}

function resolveConfig (opts, configPath) {
  // TODO: When target Node >=8:
  // const contents = await pify(fs.readFile)(configPath, 'utf8')
  const contents = pify(fs.readFile)(configPath, 'utf8')

  // 1) if `.eslintrc.json`
  if (configPath.endsWith('.json') && !configPath.endsWith('package.json')) {
    // TODO: When target Node >=8:
    // return JSON.parse(contents)

    return contents.then(JSON.parse)
  }

  // 2) if `.eslintrc.yaml` or `.eslintrc.yml`
  if (/\.ya?ml$/.test(configPath)) {
    // TODO: When target Node >=8:
    // return yaml.safeLoad(contents)
    return contents.then(yaml.safeLoad)
  }

  // 3) if one of those (depends on `configFiles` order)
  // Note: Both CommonJS and ESModules are possible :)
  // - 3.1) `.eslintrc.js`
  // - 3.2) `.eslintrc.mjs`
  // - 3.3) `eslint.config.js`
  // - 3.4) `eslint.config.mjs`
  // - 3.5) `.eslint.config.js`
  // - 3.6) `.eslint.config.js`
  if (/\.m?js$/.test(configPath)) {
    // TODO: When target Node >=8:
    // const esmLoader = await import('@std/esm')
    // const config = interop(esmLoader)(module, {
    //   cjs: true,
    //   esm: 'all',
    // })(configPath)
    // return interop(config)

    // intentionally
    const esmOpts = { cjs: true, esm: 'all' }
    return import('@std/esm')
      .then(interop)
      .then((esmLoader) => esmLoader(module, esmOpts))
      .then((esmRequire) => esmRequire(configPath))
      .then(interop)
  }

  // 4) if `.eslintrc`:
  // - 4.1) try to parse as JSON first, otherwise
  // - 4.2) try to parse as YAML
  if (configPath.endsWith('rc')) {
    // TODO: When target Node >=8:
    // try {
    //   return JSON.parse(contents)
    // } catch (er) {
    //   if (er.name === 'SyntaxError') {
    //     return yaml.safeLoad(contents)
    //   }
    //   throw er
    // }

    return contents.then(JSON.parse).catch((er) => {
      if (er.name === 'SyntaxError') {
        return contents.then(yaml.safeLoad)
      }
      throw er
    })
  }

  // 5) if config in package.json:
  // let pkg = JSON.parse(contents)

  // // - 5.1) pkg.eslint
  // return (
  //   pkg[opts.name] ||
  //   // - 5.2) pkg.eslintConfig
  //   pkg[`${opts.name}Config`] ||
  //   // - 5.3) pkg.config.eslint
  //   (pkg.config && pkg.config[opts.name]) ||
  //   // - 5.4) otherwise falsey value
  //   null
  // )
  // 5) if config in package.json:

  // uncomment above when target Node >= 8
  return contents.then(JSON.parse).then(
    (pkg) =>
      // - 5.1) pkg.eslint
      pkg[opts.name] ||
      // - 5.2) pkg.eslintConfig
      pkg[`${opts.name}Config`] ||
      // - 5.3) pkg.config.eslint
      (pkg.config && pkg.config[opts.name]) ||
      // - 5.4) otherwise falsey value
      null
  )
}

export { resolveConfigPath, resolveConfig }
