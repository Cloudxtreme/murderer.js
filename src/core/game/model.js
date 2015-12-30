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

      /* Valid combination of state flags
       *  a) !started && !active && !ended   => TODO no statistics, no kills, no suicides
       *  b)  started && !active && !ended   => TODO                no kills,              no (de)registrations
       *  c)  started &&  active && !ended   => TODO                                       no (de)registrations
       *  d)  started && !active &&  ended   => TODO                no kills, no suicides, no (de)registrations
       *
       * State transitions (0 = delete game)
       *  a -> [b,c,0] (lock, start, purge)
       *  b -> [c,d]   (resume, end)
       *  c -> [b,d]   (pause, end)
       *  d -> [0]     (purge)
       */
      started: {type: Boolean, default: false},
      active: {type: Boolean, default: false},
      ended: {type: Boolean, default: false},

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
        rings: {type: Number, required: true},
        lives: {type: Number, required: true}
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
