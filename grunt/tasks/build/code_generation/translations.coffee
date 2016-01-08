_ = require 'lodash'
path = require 'path'

module.exports = (config, grunt, helpers) ->
  paths = config.paths

  grunt.registerMultiTask "genTranslations", "Merges translations of dependent modules", ->
    data = this.data
    readFn = _.partial readTranslationsFile, data.cwd
    _.each config.modules, (mod, name) ->
      return if !mod.deploy
      translations = {}
      _.each config.locales.all, (ignored, locale) ->
        translations[locale] = helpers.recursiveExtend {}, name, (n) ->
          files = grunt.file.expand data, data.files n, locale
          _.merge.apply this, files.map readFn
      destination = "#{paths.destination.dev}/scripts/#{name}/bootstrap/translations.js"
      grunt.file.write destination, data.filePrototype name, translations

  getLocaleLine = (locale, translation) ->
    "  $translateProvider.translations(\"#{locale}\", #{JSON.stringify translation});"

  getLocalesString = (translations) ->
    Object.keys(config.locales.all).map((locale) -> getLocaleLine locale, translations[locale]).join grunt.util.linefeed

  readTranslationsFile = (cwd, file) ->
    filePath = "#{cwd}/#{file}"
    if grunt.file.isFile filePath
      return grunt.file.readJSON filePath if file.endsWith ".json"
      parts = path.basename(file).split "."
      ignored = parts.pop() # file-extension
      key = parts.pop()
      obj = o = {}
      o = o[p] = {} for p in parts
      o[key] = grunt.file.read filePath
      obj

  all:
    cwd: paths.source
    files: (name, locale) -> [
      "#{name}/translations/#{locale}/**/*" # files within en-us/
    ]
    filePrototype: (name, translations) ->
      """
      angular.module("#{name}").config(["$translateProvider", function($translateProvider) { "use strict";
      #{getLocalesString translations}
        $translateProvider.useSanitizeValueStrategy(null);
        $translateProvider.useLocalStorage();
        $translateProvider.preferredLanguage("#{config.locales.default}");
      }]);
      """
