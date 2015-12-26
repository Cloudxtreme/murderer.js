"use strict";

var COLLECTION_NAME = "Invitation";

var mongoose = require("mongoose");
var modelBase = require.main.require("./utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},

      game: {type: ObjectID, ref: "Game"},
      user: {type: ObjectID, ref: "User"},
      accepted: Date,
      rejected: Date
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, exports);

exports.COLLECTION_NAME = COLLECTION_NAME;
