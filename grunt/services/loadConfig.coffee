_ = require 'lodash'
path = require 'path'

module.exports = (grunt, cwd, configDir, configObj = {}) ->
  ###---------------------------------------------- Load config files  ----------------------------------------------###
  _.each ['init', 'modules', 'paths', 'locales', 'styles', 'provide', 'libraries', 'copy', 'livereload'], (key) ->
    file = path.join configDir, key + ".json"
    fileCustom = path.join configDir, key + ".local.json"
    configObj[key] = content = if grunt.file.exists file then grunt.file.readJSON file else {}
    _.merge content, grunt.file.readJSON fileCustom if grunt.file.exists fileCustom

  ###----------------------------------------------- Add package-info -----------------------------------------------###
  configObj.package = grunt.file.readJSON path.join cwd, 'package.json'

  ###--------------------------------------------- Add bower target-dir ---------------------------------------------###
  bowerCfg = path.join cwd, '.bowerrc'
  bower = configObj.paths.bower =
    relative: grunt.file.exists(bowerCfg) && (grunt.file.readJSON bowerCfg).directory || 'bower_components'
    destination: path.join configObj.paths.destination.dev, configObj.paths.destinationLibs
  bower.absolute = path.join cwd, bower.relative

  ###-------------------------------------------- Prepare init for tasks --------------------------------------------###
  configObj._init = {}

  addStaticTemplates = (mod, name) ->
    _.each grunt.file.expand("#{configObj.paths.source}/#{name}/templates-static/*.html"), (file) ->
      key = /([^\/]+)\.html$/.exec(file)[1]
      if !configObj._init.hasOwnProperty key
        configObj._init[key] =
          key: key
          camelKey: key.replace(/_+(.)/, (ignored, char) -> char.toUpperCase())
          modules: [name]
          fileFn: (n) -> "#{configObj.paths.source}/#{n}/templates-static/#{key}.html"
      else
        configObj._init[key].modules.push name

  _.each configObj.modules, addStaticTemplates

  ###----------------------------------------- Prepare Libraries for tasks  -----------------------------------------###
  added = {}
  jsLibs = {}
  jsMinLibs = {}
  _.each configObj.libraries.javascript, (libs, name) ->
    jsLibs[name] = Object.keys libs
    jsMinLibs[name] = _.map libs, (minJs, js) ->
      if minJs == true then js.replace(/(\.[^\.]+)$/, ".min$1") else minJs || js
  fileLibs = {}
  _.each configObj.libraries.files, (libs, name) ->
    fileLibs[name] = _.map libs, (lib) ->
      lib = _.clone lib
      lib.cwd = path.join bower.relative, lib.cwd
      lib

  configObj.__libs =
    js: {}
    jsMin: {}
    static: {}
  configObj.__scripts =
    js: {}

  addLibs = (depName, moduleName) ->
    return if added[moduleName][depName]
    added[moduleName][depName] = true
    if jsLibs[depName]?.length
      Array.prototype.push.apply configObj.__libs.js[moduleName], jsLibs[depName]
      Array.prototype.push.apply configObj.__libs.jsMin[moduleName], jsMinLibs[depName]
    if fileLibs[depName]?.length
      lib.expand = true for lib in fileLibs[depName] when !lib.expand?
      Array.prototype.push.apply configObj.__libs.static[moduleName], fileLibs[depName]
    configObj.__scripts.js[moduleName].push "scripts/#{depName}/main.js", "scripts/#{depName}/**/*.js"

  resolveDependencies = (dependencies, moduleName) ->
    for dependency in dependencies
      depModule = configObj.modules[dependency]
      resolveDependencies depModule.dependencies, moduleName if depModule?.dependencies?.length
      addLibs dependency, moduleName

  _.each configObj.modules, (module, name) ->
    configObj.__libs.js[name] = []
    configObj.__libs.jsMin[name] = []
    configObj.__libs.static[name] = []
    configObj.__scripts.js[name] = []
    if module.deploy
      added[name] = {}
      resolveDependencies module.dependencies, name if module.dependencies?.length
      addLibs name, name

  configObj
