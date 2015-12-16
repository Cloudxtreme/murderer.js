_ = require 'lodash'

module.exports = (config, grunt, helpers) ->
  grunt.loadNpmTasks 'grunt-html-build'

  paths = config.paths
  serverConfig = config.loadServerConfig "server"

  staticTemplates = {}

  _.each config._init, (tpl) ->
    staticTemplates[tpl.camelKey] = tpl.fileFn if !staticTemplates.hasOwnProperty tpl.camelKey

  getSections = (n) ->
    obj = {}
    for key, pathFn of staticTemplates
      file = helpers.findFile n, pathFn
      obj[key] = if file? then file else "grunt/helper/empty_file"
    obj
  getLiveReload = (port) ->
    port && "<script src=\"http://localhost:#{if port == true then 35729 else port}/livereload.js\"></script>" || ""
  prefixBower = (lib) -> paths.bower.destination + '/' + lib
  prefixDev = (lib) -> paths.destination.dev + '/' + lib

  htmlbuild = {}

  _.each config.modules, (mod, name) ->
    return if !mod.deploy

    sections = getSections name

    htmlbuild[name + '_dev'] =
      src: helpers.findFile(name, (n) -> "#{paths.source}/#{n}/index.html")
      dest: "#{paths.destination.dev}/#{name}.html"
      options:
        prefix: '/'
        relative: true
        scripts:
          main: config.__libs.js[name].map(prefixBower).concat config.__scripts.js[name].map prefixDev
        sections: sections
        data:
          base: serverConfig.dev.url
          title: "#{config.package.name} - Development - #{config.package.version}"
          app: name
          livereload: getLiveReload config.livereload.port
          styles: (for key, array of config.styles
            for n in array when (helpers.findFile name, (m) -> "#{paths.source}/#{m}/styles/#{n}.less")?
              "<link type='text/css' rel='stylesheet' media='#{key}' href='/styles/#{name}/#{n}.css'>").join "\n"

    htmlbuild[name + '_dist'] =
      src: helpers.findFile(name, (n) -> "#{paths.source}/#{n}/index.html")
      dest: "#{paths.destination.dist}/#{name}.html"
      options:
        prefix: '/'
        relative: true
        scripts:
          main: ["#{paths.destination.dist}/scripts/#{name}.min.js"]
        sections: sections
        data:
          base: serverConfig.dist.url
          title: config.package.name
          app: name
          styles: (for key, array of config.styles
            for n in array when (helpers.findFile name, (m) -> "#{paths.source}/#{m}/styles/#{n}.less")?
              "<link type='text/css' rel='stylesheet' media='#{key}' href='/styles/#{name}-#{n}.min.css'>").join "\n"

  helpers.registerTaskByPattern 'htmlbuild_dev', 'htmlbuild', htmlbuild, /_dev/
  helpers.registerTaskByPattern 'htmlbuild_dist', 'htmlbuild', htmlbuild, /_dist/

  htmlbuild