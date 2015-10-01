_ = require 'lodash'

module.exports = (config, grunt, helpers) ->
  grunt.loadNpmTasks "grunt-contrib-less"

  paths = config.paths

  less =
    options:
      paths: [paths.destination.dev + '/styles']
      ieCompat: false
      relativeUrls: false

  _.each config.modules, (mod, name) ->
    return if !mod.deploy
    devFiles = {}
    distFiles = {}
    for ignored, keys of config.styles
      for key in keys when (helpers.findFile name, (n) -> "#{paths.source}/#{n}/styles/#{key}.less")
        devFiles["#{paths.destination.dev}/styles/#{name}/#{key}.css"] = "<%= findless.#{name}.#{key} %>"
        distFiles["#{paths.destination.dist}/styles/#{name}-#{key}.min.css"] = "<%= findless.#{name}.#{key} %>"
    less[name + '_dev'] =
      files: devFiles
      options:
        sourceMap: true
        sourceMapBasepath: paths.destination.dev
        sourceMapRootpath: '/'
    less[name + '_dist'] =
      files: distFiles
      options:
        cleancss: true

  helpers.registerTaskByPattern 'less_dev_plain', 'less', less, /_dev/
  helpers.registerTaskByPattern 'less_dist_plain', 'less', less, /_dist/

  grunt.registerTask 'less_dev', ['findless', 'less_dev_plain']
  grunt.registerTask 'less_dist', ['findless', 'less_dist_plain']

  less