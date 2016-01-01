"use strict";

var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var generation = require("./services/generation");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

exports.qGenerate = generation.generate;
