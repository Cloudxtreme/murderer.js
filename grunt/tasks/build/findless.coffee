_ = require 'lodash'

module.exports = (config, grunt, helpers) ->
  paths = config.paths

  grunt.registerTask "findless", "Determines (runtime) the location of module-dependent less-files to compile", ->
    _.each config.modules, (mod, name) ->
      return if !mod.deploy
      for ignored, keys of config.styles
        for key in keys
          file = helpers.findFile name, (n) -> "#{paths.destination.dev}/styles/#{n}/#{key}.less"
          grunt.config.set "findless.#{name}.#{key}", file

  {}