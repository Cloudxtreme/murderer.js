_ = require 'lodash'

module.exports = (config, grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-clean'

  paths = config.paths

  getDestinations = (suffix) ->
    [
      paths.destination.dist + suffix
      paths.destination.dev + suffix
    ]

  clean =
    all: getDestinations ''
    html: getDestinations '/*.html'
    styles: getDestinations '/styles'
    scripts: getDestinations '/scripts'
    translations: getDestinations '/scripts/*/configs/translations.js'

  clean