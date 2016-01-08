_ = require 'lodash'
path = require 'path'

module.exports = (config, grunt, ignored, dirs) ->
  grunt.loadNpmTasks 'grunt-contrib-watch'

  paths = config.paths

  watch =
    options:
      livereload: config.livereload.port
      livereloadOnError: false
      spawn: false
      interrupt: false # until https://github.com/gruntjs/grunt-contrib-watch/issues/377 gets fixed
      debounceDelay: 250
    grunt:
      files: ['Gruntfile.coffee', dirs.base + '/**/*', '.bowerrc']
      options:
        reload: true
    dependencies:
      files: ['package.json', 'bower.json']
      tasks: ['clean', 'build_dev']
    js:
      files: "#{paths.source}/**/*.js",
      tasks: ['copy_dev_js']
    less:
      files: "#{paths.source}/**/*.less"
      tasks: ['clean:styles', 'copy_dev_less', 'copy_dev_static', 'less_dev', 'autoprefixer_dev']
    static:
      files: ["#{paths.source}/static/**/*"].concat(config.copy.static.map (s) -> "#{paths.source}/*/#{s}/**/*")
      tasks: ['copy_dev_static', 'htmlbuild_dev']
    htmlbuild:
    # FIXME htmlbuild_dev wouldn't refresh new/removed files since file got calculated on gruntfile-init
      files: ["#{paths.source}/*/index.html", "#{paths.source}/*/templates-static/**/*"]
      tasks: ['htmlbuild_dev']
    translations:
      files: "#{paths.source}/*/translations/**/*"
      tasks: ['clean:translations', 'genTranslations', 'htmlbuild_dev']

  watch