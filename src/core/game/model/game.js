"use strict";

var COLLECTION_NAME = "Game";

var mongoose = require("mongoose");
var modelBase = require("../../../utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      mdate: {type: Date, default: Date.now},
      name: {type: String, required: true, unique: true, trim: true},
      active: {type: Boolean, default: true},

      participants: {type: [{type: ObjectID, ref: "User"}], default: []},
      rings: {
        type: [{
          active: {
            type: [{
              user: {type: ObjectID, ref: "User"},
              token: String
            }], default: []
          },
          kills: {
            type: [{
              entryDate: {type: Date, default: Date.now},
              murderer: {type: ObjectID, ref: "User"},
              victim: {type: ObjectID, ref: "User"},
              message: String,
              token: String
            }], default: []
          }
        }], default: []
      },
      score: Mixed // {user.id: [user.id]}
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, module.exports, ["name"]);

module.exports.COLLECTION_NAME = COLLECTION_NAME;
