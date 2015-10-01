_ = require 'lodash'
path = require 'path'

module.exports = (config, grunt, helpers) ->
  grunt.loadNpmTasks 'grunt-contrib-copy'

  paths = config.paths
  copy =
    dev_static:
      files: [
        expand: true
        src: "static/**/*"
        cwd: paths.source + '/static/'
        dest: paths.destination.dev
      ]
    dist_static:
      files: [
        expand: true
        src: "static/**/*"
        cwd: paths.source + '/static/'
        dest: paths.destination.dist
      ]

  getStaticOptions = (name, obj, destination) ->
    cwd: path.join paths.source, name, obj
    dest: path.join destination, obj, name
    src: '**/*'
    expand: true

  _.each config.modules, (mod, name) ->
    recursiveFiles = helpers.recursiveFilesBuilder name, mod, true

    devLibsFiles = recursiveFiles (n) ->
      config.__libs.static[n].map((lib) ->
        lib = _.clone lib
        lib.dest = if lib.dest? then "#{paths.destination.dev}/#{lib.dest}" else paths.destination.dev
        lib
      ).concat config.copy.static.map (obj) -> getStaticOptions name, obj, paths.destination.dev

    distLibsFiles = recursiveFiles (n) ->
      _.compact(config.__libs.static[n].map((lib) ->
        return null if !lib.deploy
        lib = _.clone lib
        lib.dest = if lib.dest? then "#{paths.destination.dist}/#{lib.dest}" else paths.destination.dist
        lib
      )).concat config.copy.static.map (obj) -> getStaticOptions name, obj, paths.destination.dist

    copy[name + '_dev_static'] =
      files: devLibsFiles

    copy[name + '_dist_static'] =
      files: distLibsFiles

    return if !mod.deploy

    copy[name + '_dev_bower'] =
      files: [
        expand: true
        cwd: paths.bower.relative
        dest: paths.bower.destination
        src: config.__libs.js[name]
      ]
    copy[name + '_dev_less'] =
      files: [
        expand: true
        src: recursiveFiles (n) -> "#{n}/styles/**/*.less"
        cwd: paths.source
        dest: paths.destination.dev
        rename: (dest, path) -> "#{dest}/#{path.replace /^([^\/]*)\/styles/, 'styles/$1'}"
      ]

  helpers.registerTaskByPattern 'copy_dev', 'copy', copy, /(?:^|_)dev(?:_|$)/
  helpers.registerTaskByPattern 'copy_dist', 'copy', copy, /(?:^|_)dist(?:_|$)/

  helpers.registerTaskByPattern 'copy_dev_less', 'copy', copy, /(?:^|_)dev_less/
  helpers.registerTaskByPattern 'copy_dev_static', 'copy', copy, /(?:^|_)dev_static/
  helpers.registerTaskByPattern 'copy_dist_static', 'copy', copy, /(?:^|_)dist_static/

  copy