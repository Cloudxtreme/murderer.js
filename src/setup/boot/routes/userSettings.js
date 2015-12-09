"use strict";

var express = require("express");

var userC = require.main.require("./core/user/controller");

function loginAttempt(req, res, successRoute, failStatus) {
  return function (err) {
    if (err == null) {
      res.redirect(successRoute || "/");
    } else {
      req.log.error(err);
      res.sendStatus(failStatus || 500);
    }
  };
}

module.exports = function (app) {
  var router = express.Router();

  router.post("/:username/reset-password/:token", function (req, res) {
    if (!req.body.password || req.body.password !== req.body.repeatPassword) {
      return res.status(400).send(new Error("No password specified or passwords don\"t match."));
    }
    userC.updatePasswordByToken(req, req.params.username, req.params.token, req.body.password, function (err, user) {
      if (err != null) {
        if (typeof err === "string") {
          req.log.error({message: err}, "password reset failed");
          res.redirect("/401");
        } else {
          req.log.error({err: err});
          res.send(err);
        }
      } else {
        req.logIn(user, loginAttempt(req, res));
      }
    });
  });

  app.use("/settings", router);
};
