_ = require 'lodash'
path = require 'path'
crypto = require 'crypto'

module.exports = (config, grunt, ignored, dirs) ->
  dbName = config.package.name.toLowerCase().replace(/\W/g, "")

  generateSecret = -> crypto.randomBytes(64).toString 'base64'
  getTaskName = (key) -> "init#{key[0].toUpperCase() + key.substring(1)}Config"

  append =
    paths:
      "dev.frontend": config.paths.destination.dev
      "dist.frontend": config.paths.destination.dist
    database:
      dev: "mongodb://localhost/#{dbName}_dev"
      dist: "mongodb://localhost/#{dbName}"
    security:
      "dev.secret": generateSecret()
      "dist.secret": generateSecret()
    modules:
      _noEnv: true
      all: _.keys config.modules
      admin: "admin"

  tasks = _.map append, (values, file) ->
    taskName = getTaskName file
    grunt.registerTask taskName, "Applies grunt-config and package.json info to server-config (#{file}).", ->
      filename = path.join dirs.main, config.paths.serverConfig, "#{file}.local.json"
      grunt.file.write filename, '{}' if !grunt.file.exists filename
      content = grunt.file.readJSON filename
      _.each values, (value, key) ->
        c = content
        parts = key.split '.'
        lastIdx = parts.length - 1
        for part, i in parts when i < lastIdx
          if c.hasOwnProperty part then c = c[part] else c = c[part] = {}
        c[parts[lastIdx]] = value
      grunt.file.write filename, JSON.stringify content, null, '  '
    taskName

  grunt.registerTask "initConfig", tasks

  {}