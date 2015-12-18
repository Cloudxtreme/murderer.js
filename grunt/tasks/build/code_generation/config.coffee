_ = require 'lodash'

module.exports = (config, grunt) ->
  paths = config.paths

  getContent = (name, id, key, env) ->
    parts = key.split "."
    data = config.loadServerConfig(parts.shift(), env)
    data = if data != null && data.hasOwnProperty k then data[k] else undefined for k in parts
    "angular.module(\"#{name}\").constant(\"#{id}\", #{JSON.stringify data});"

  writeFile = (getDestination, name, id, key, env) ->
    destination = getDestination name, id
    grunt.file.write destination, getContent name, id, key, env

  grunt.registerMultiTask "genConfig", "Adds angular-constants to provide configuration as defined.", ->
    data = this.data
    options = this.options()
    _.each options.provide, (value) ->
      writeFile options.getDestination, value.module, value.constant, value.key, data.env

  options:
    provide: config.provide.angular.config
    getDestination: (module, id) -> "#{paths.destination.dev}/scripts/#{module}/constants/#{id}.js"
  dev:
    env: "dev"
  dist:
    env: "dist"
