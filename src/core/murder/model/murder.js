"use strict";

var COLLECTION_NAME = "Murder";

var mongoose = require("mongoose");
var modelBase = require("../../../utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      message: String,

      murderer: {type: ObjectID, ref: "User"},
      victim: {type: ObjectID, ref: "User"},

      ring: {type: ObjectID, ref: "Ring"}
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, module.exports);

module.exports.COLLECTION_NAME = COLLECTION_NAME;
