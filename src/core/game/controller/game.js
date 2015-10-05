"use strict";

var _ = require("lodash");

var model = require("../model/game");
var ctrlBase = require("../../../utils/controllerBase");
var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;

ctrlBase(model, module.exports);

function isTokenInUse(game, token) {
  return _.any(game.rings, function (ring) {
    var tokens = _.pluck(ring.active, "token");
    return _.contains(tokens, token);
  });
}

function getRingInstance(game, user) {
  var token;
  do {
    token = security.generateToken(config.security.humanToken.bytes).toUpperCase();
  } while (isTokenInUse(game, token));
  return {user: user, token: token};
}

module.exports.addRings = function (game, amount) {
  if (!(game.rings instanceof Array)) {
    game.rings = [];
  }
  while (amount--) {
    game.rings.push({active: _.map(_.shuffle(game.participants), _.partial(getRingInstance, game))});
  }
  return game;
};

/*============================================ Validation and Middleware  ============================================*/

/*---------------------------------------------------- Validation ----------------------------------------------------*/

var validate = module.exports.validate;

validate("create", function (next, body) {
  if (body.score == null) {
    var s = body.score = {};
    _.each(body.participants, function (user) {
      s[user] = [];
    });
  }
  next();
});
