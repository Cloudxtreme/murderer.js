_ = require 'lodash'

module.exports = (config, grunt) ->
  grunt.loadNpmTasks "grunt-ng-annotate"

  paths = config.paths

  options:
    singleQuotes: true
  all:
    files: [
      expand: true
      src: "#{paths.destination.dev}/scripts/**/*.js"
    ]