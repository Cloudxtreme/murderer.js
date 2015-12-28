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

      author: {type: ObjectID, ref: "User"},

      passwords: [String], // TODO restrict participation by password(s) iff set
      inviteOnly: {type: Boolean, default: false}, // TODO hide from public list when true
      // TODO implement invitation system

      groups: {
        type: [{
          group: {type: ObjectID, ref: "Group"},
          users: {
            type: [{ // TODO apply changes to services (previously users: [User._id])
              user: {type: ObjectID, ref: "User"},
              name: {type: String, required: true},
              message: String
            }],
            default: []
          }
        }], default: []
      },

      rings: {type: [{type: ObjectID, ref: "Ring"}], default: []},

      description: {type: String, default: ""}, // markdown syntax

      startMeta: {
        rings: {type: Number, required: true}, // TODO use for start of game
        lives: {type: Number, required: true} // TODO use for start of game
      },

      limit: {
        participants: Number, // TODO maximum amount of users to participate
        invitedParticipants: Number // TODO maximum amount of users to participate when invited to game
      },

      schedule: {
        end: {type: Date, required: true}, // TODO automatically end game
        start: Date, // TODO automatically start game iff given
        activate: {type: [Date], default: []}, // TODO automatically activate game
        deactivate: {type: [Date], default: []} // TODO automatically deactivate game
      },

      log: {
        deactivate: {type: [Date], default: []}, // TODO track
        activate: {type: [Date], default: []} // TODO track
      }
    }
);

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, GameSchema);
modelBase(model, exports, ["name"]);

exports.COLLECTION_NAME = COLLECTION_NAME;
