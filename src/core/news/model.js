"use strict";

var COLLECTION_NAME = "News";

var mongoose = require("mongoose");
var modelBase = require.main.require("./utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      mdate: {type: Date, default: Date.now},

      server: {type: Boolean, default: false},
      entryDate: {type: Date, default: Date.now},
      author: {type: ObjectID, ref: "User"},
      message: {type: String, required: true},
      game: {type: ObjectID, ref: "Game"},
      ring: Number
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, module.exports);

module.exports.COLLECTION_NAME = COLLECTION_NAME;
