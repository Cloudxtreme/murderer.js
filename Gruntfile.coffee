path = require 'path'

PATH_BASE = path.join __dirname, 'grunt'

dirs =
  main: __dirname
  base: PATH_BASE
  config: path.join PATH_BASE, 'config'
  services: path.join PATH_BASE, 'services'
  tasks: path.join PATH_BASE, 'tasks'

module.exports = (grunt) ->
  ###--------------------------------------- Initialize Settings and Helpers  ---------------------------------------###
  getService = (name) -> require path.join dirs.services, name
  config = getService('loadConfig') grunt, __dirname, dirs.config
  helpers = getService('helpers') grunt, config, getService

  ###----------------------------------------------- Initialize Tasks -----------------------------------------------###
  loadTask = (file) -> require(path.join dirs.tasks, file) config, grunt, helpers, dirs

  # TODO jshint validation within dist

  grunt.initConfig cfg =
    pkg: config.package
  # source file generation
    initConfig: loadTask "init/config"
  # file removal
    clean: loadTask "clean/clean"
  # dependencies
    npminstall: loadTask "dependencies/npminstall"
    bower: loadTask "dependencies/bower"
  # file management
    copy: loadTask "build/copy"
  # file generation
    genTranslations: loadTask "build/code_generation/translations"
    genLocales: loadTask "build/code_generation/locales"
    genConstants: loadTask "build/code_generation/constants"
  # html build
    htmlbuild: loadTask "build/compilation/htmlbuild"
  # styles build
    findless: loadTask "build/findless"
    less: loadTask "build/compilation/less"
    autoprefixer: loadTask "build/compilation/autoprefixer"
  # scripts build
    ngAnnotate: loadTask "build/compilation/ngannotate"
    uglify: loadTask "build/compilation/uglify"
  # file observation
    watch: loadTask "watch/watch"

  ###------------------------------------------------ Define Aliases ------------------------------------------------###
  grunt.registerTask 'default', ['dist']
  # common tasks
  grunt.registerTask 'init', Object.keys(cfg).filter (task) -> /^init[A-Z]/.test task
  grunt.registerTask 'dev', ['dependencies', 'build_dev', 'watch']
  grunt.registerTask 'dist', ['dependencies', 'build_dist']
  # - dependencies
  grunt.registerTask 'dependencies', ['npm-install', 'bower']
  # - build process
  grunt.registerTask 'build_dev', ['copy_dev', 'generate', 'compile_dev']
  grunt.registerTask 'build_dist', ['copy_dev', 'generate', 'compile_dist', 'copy_dist']
  # - - code-generation
  grunt.registerTask 'generate', Object.keys(cfg).filter (task) -> /^gen[A-Z]/.test task
  # - - compilation
  grunt.registerTask 'compile_dev', ['less_dev', 'autoprefixer_dev', 'htmlbuild_dev']
  grunt.registerTask 'compile_dist', ['ngAnnotate', 'uglify', 'less_dist', 'autoprefixer_dist', 'htmlbuild_dist']