_ = require 'lodash'

module.exports = (config, grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-uglify'

  paths = config.paths
  prefixBower = (lib) -> paths.bower.relative + '/' + lib
  prefixDev = (lib) -> paths.destination.dev + '/' + lib

  uglify = {}

  getBanner = (name) ->
    """
    /*!
     * <%= pkg.name %> v<%= pkg.version %>#{ if config.package.homepage? then ' (<%= pkg.homepage %>)' else '' }
     * Build: <%= grunt.template.today('yyyy-mm-dd') %>
     * Module: #{name}<%= grunt.util.linefeed %>
    """ +
        (if config.package.license then ' * Licensed under <%= pkg.license %><%= grunt.util.linefeed %>' else '') +
        ' */<%= grunt.util.linefeed %>'

  _.each config.modules, (mod, name) ->
    return if !mod.deploy
    # TODO move banner below libs
    uglify[name] =
      options:
        banner: getBanner name
        preserveComments: 'some'
        maxLineLen: 8000
      files: {}
    uglify[name].files["#{paths.destination.dist}/scripts/#{name}.min.js"] =
        config.__libs.jsMin[name].map(prefixBower)
        .concat config.__scripts.js[name].map(prefixDev)

  uglify