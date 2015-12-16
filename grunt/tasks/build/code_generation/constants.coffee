_ = require 'lodash'

module.exports = (config, grunt) ->
  paths = config.paths

  getContent = (name, id, data) -> "angular.module(\"#{name}\").constant(\"#{id}\", #{JSON.stringify data});"

  writeFile = (getDestination, name, id, data) ->
    destination = getDestination name, id
    grunt.file.write destination, getContent name, id, data

  grunt.registerMultiTask "genConstants", "Adds angular-constants as defined within provide config.", ->
    data = this.data
    _.each data.constants, (value) -> writeFile data.getDestination, value.module, value.constant, value.data

  all:
    constants: config.provide.angular.constants
    getDestination: (module, id) -> "#{paths.destination.dev}/scripts/#{module}/constants/#{id}.js"