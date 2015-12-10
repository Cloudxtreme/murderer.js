"use strict";

var tmpCount = 0;

/*===================================================== Exports  =====================================================*/

exports.createGuest = createGuest;
exports.createAdmin = createAdmin;

/*==================================================== Functions  ====================================================*/

function createGuest() {
  var id = tmpCount++;
  return {
    _id: "guest/" + id,
    guest: true,
    username: "guest/" + id
  };
}

function createAdmin() {
  var id = tmpCount++;
  return {
    _id: "admin/" + id,
    admin: true,
    activated: true,
    username: "admin/" + id
  };
}
