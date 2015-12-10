"use strict";

var COLLECTION_NAME = "Murder";

var mongoose = require("mongoose");
var modelBase = require.main.require("./utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      message: String,

      murderer: {type: ObjectID, ref: "User"},
      victim: {type: ObjectID, ref: "User"},

      ring: {type: ObjectID, ref: "Ring"},
      game: {type: ObjectID, ref: "Game"}
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, exports);

exports.COLLECTION_NAME = COLLECTION_NAME;
