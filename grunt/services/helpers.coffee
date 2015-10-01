_ = require 'lodash'

module.exports = (grunt, config, getService) ->
  helpers =
    getService: getService

    registerTaskByPattern: (name, configName, configs, regex) ->
      tasks = Object.keys(configs).filter (task) -> regex.test task
      grunt.registerTask name, tasks.map (taskKey) -> "#{configName}:#{taskKey}"

    recursiveFilesBuilder: (name, mod, invert) ->
      dependencies = mod.dependencies || []
      if invert
        (fn) ->
          _.flatten (dependencies.map (dependency)->
            helpers.recursiveFilesBuilder(dependency, config.modules[dependency]) fn
          ).concat [fn name, mod]
      else
        (fn) ->
          _.flatten [fn name, mod].concat dependencies.map (dependency)->
            helpers.recursiveFilesBuilder(dependency, config.modules[dependency]) fn

    findFile: (modName, fn) ->
      file = fn modName
      return file if grunt.file.exists file
      return null if !config.modules[modName].dependencies?.length
      for n in _.clone(config.modules[modName].dependencies).reverse()
        file = helpers.findFile n, fn
        return file if file?
      null

    recursiveExtend: (obj, name, fn) ->
      mod = config.modules[name]
      mod.dependencies?.forEach (dependency) -> helpers.recursiveExtend obj, dependency, fn
      _.merge obj, fn name, mod
