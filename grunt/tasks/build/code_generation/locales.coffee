_ = require 'lodash'

module.exports = (config, grunt) ->
  paths = config.paths

  getContent = (name, service) ->
    """
    angular.module("#{name}").factory("#{service}", function() { "use strict";
      return #{JSON.stringify config.locales};
    });
    """

  writeFile = (getDestination, name, service) ->
    destination = getDestination name, service
    grunt.file.write destination, getContent name, service

  grunt.registerMultiTask "genLocales", "Adds an angular-service that holds the locale-data", ->
    data = this.data
    _.each data.provides, (value) ->
      writeFile data.getDestination, value.module, value.service

  all:
    provides: config.provide.angular.locales
    getDestination: (module, service) -> "#{paths.destination.dev}/scripts/#{module}/services/#{service}.js"