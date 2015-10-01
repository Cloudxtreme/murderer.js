_ = require 'lodash'

module.exports = (config, grunt, helpers) ->
  grunt.loadNpmTasks "grunt-autoprefixer"

  paths = config.paths

  autoprefixer = {}

  _.each config.modules, (mod, name) ->
    return if !mod.deploy
    devFiles = {}
    distFiles = {}
    for ignored, keys of config.styles
      for key in keys when (helpers.findFile name, (n) -> "#{paths.source}/#{n}/styles/#{key}.less")
        devFile = "#{paths.destination.dev}/styles/#{name}/#{key}.css"
        distFile = "#{paths.destination.dist}/styles/#{name}-#{key}.min.css"
        devFiles[devFile] = devFile
        distFiles[distFile] = distFile
    autoprefixer[name + '_dev'] =
      files: devFiles
    autoprefixer[name + '_dist'] =
      files: distFiles

  helpers.registerTaskByPattern 'autoprefixer_dev', 'autoprefixer', autoprefixer, /_dev/
  helpers.registerTaskByPattern 'autoprefixer_dist', 'autoprefixer', autoprefixer, /_dist/

  autoprefixer