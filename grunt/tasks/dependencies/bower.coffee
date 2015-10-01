module.exports = (ignored, grunt) ->
  grunt.loadNpmTasks "grunt-bower-task"

  install:
    options:
      copy: false