"use strict";

var COLLECTION_NAME = "Message";

var mongoose = require("mongoose");
var modelBase = require.main.require("./utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},

      server: {type: Boolean, default: false},
      author: {type: ObjectID, ref: "User"},
      message: {type: String, required: true},
      game: {type: ObjectID, ref: "Game"},
      ring: {type: ObjectID, ref: "Ring"}
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, exports);

exports.COLLECTION_NAME = COLLECTION_NAME;