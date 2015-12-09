"use strict";

var COLLECTION_NAME = "Ring";

var mongoose = require("mongoose");
var modelBase = require.main.require("./utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      active: {type: Number},

      chain: [{
        user: {type: ObjectID, ref: "User", required: true},
        token: {type: String, required: true},
        murder: {type: ObjectID, ref: "Murder"},
        target: {type: Boolean, default: true} // [A,B,C] Needed because if B commits suicide, A may still kill B (in
                                               // real life the kill might have happened before the suicide).
      }]
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, module.exports, ["name"]);

module.exports.COLLECTION_NAME = COLLECTION_NAME;
