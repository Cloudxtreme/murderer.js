"use strict";

var _ = require("lodash");
var Q = require("q");
var mailer = require("nodemailer");
var tpl = require.main.require("./utils/templates");
var config = require.main.require("./utils/config").main;

var emailTransporter = mailer.createTransport({
  host: config.mailer.host,
  port: config.mailer.port,
  secure: config.mailer.secure,
  auth: {
    user: config.mailer.username,
    pass: config.mailer.password
  }
});

var qSendMail = Q.nbind(emailTransporter.sendMail, emailTransporter);

// TODO add nested extend within config.mails, add signature etc.

/*===================================================== Exports  =====================================================*/

exports.sendTemplateByKey = sendTemplateByKey;

/*==================================================== Functions  ====================================================*/

function sendMail(email, body) {
  if (!config.mailer.host) { return Q.reject("No host specified."); }
  return qSendMail(_.extend(body, {to: email, from: config.mailer.email}));
}

function sendTemplate(email, body, data) {
  return sendMail(email, {
    subject: tpl(body.subject, data) + "\n",
    text: tpl(body.message, data) + "\n"
  });
}

function sendTemplateByKey(scope, user, key, data) {
  var mail = _.get(config.mails, key);
  if (mail == null) { return Q.reject("Template not found."); }

  data = _.extend(getEmailData(user), data);
  return sendTemplate(user.email, mail, data)
      .then(function () {
        scope.log.debug({data: data, key: key, addressee: user}, "email sent");
      }, function (err) {
        scope.log.warn({err: err, key: key, addressee: user}, "email failed to send");
      });
}

function getEmailData(user) {
  return {
    name: config.pkg.name, // TODO pass whole config.pkg, adjust templates to accept nesting
    id: user._id,
    username: user.username,
    email: user.email
  };
}
