_ = require 'lodash'

module.exports = (config, grunt, helpers) ->
  paths = config.paths

  grunt.registerMultiTask "genTranslations", "Merges translations of dependent modules", ->
    data = this.data
    _.each config.modules, (mod, name) ->
      return if !mod.deploy
      translations = {}
      _.each config.locales.all, (ignored, locale) ->
        translations[locale] = helpers.recursiveExtend {}, name, (n) ->
          files = grunt.file.expand data, data.files n, locale
          _.merge.apply this, files.map (file) -> grunt.file.readJSON "#{data.cwd}/#{file}"
      destination = "#{paths.destination.dev}/scripts/#{name}/bootstrap/translations.js"
      grunt.file.write destination, data.filePrototype name, translations

  getLocaleLine = (locale, translation) ->
    "  $translateProvider.translations(\"#{locale}\", #{JSON.stringify translation});"

  getLocalesString = (translations) ->
    Object.keys(config.locales.all).map((locale) -> getLocaleLine locale, translations[locale]).join grunt.util.linefeed

  all:
    cwd: paths.source
    files: (name, locale) -> [
      "#{name}/translations/**/#{locale}.json" # en-us.json files in any sub-directory
      "#{name}/translations/#{locale}/**/*.json" # json-files within en-us/
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
