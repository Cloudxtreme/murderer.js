"use strict";

var COLLECTION_NAME = "Game";

var mongoose = require("mongoose");
var modelBase = require.main.require("./utils/modelBase");

var Schema = require("mongoose").Schema;
var ObjectID = Schema.Types.ObjectId;

/*================================================ Schema Definition  ================================================*/

var GameSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      name: {type: String, required: true, unique: true, trim: true},

      started: {type: Boolean, default: false}, // if started, don't accept new registrations
      active: {type: Boolean, default: false}, // if started but not active, still show stats

      groups: {
        type: [{
          group: {type: ObjectID, ref: "Group"},
          users: {type: [{ // TODO apply changes to services (previously users: [User._id])
            user: {type: ObjectID, ref: "User"},
            name: {type: String, required: true},
            message: String
          }], default: []}
        }], default: []
      },

      rings: {type: [{type: ObjectID, ref: "Ring"}], default: []},

      schedule: { // TODO handle automatic actions
        start: Date,
        autoStart: {type: Boolean, default: false},
        end: Date,
        autoEnd: {type: Boolean, default: false},
        inactive: {type: [{type: Date, required: true}], default: []}, // alternating inactive-start and -end dates
        autoInactive: {type: Boolean, default: false}
      }
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, exports, ["name"]);

exports.COLLECTION_NAME = COLLECTION_NAME;
