angular.module("closed").controller("contractsCtrl", function ($scope, $rootScope, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.games = null;

  /*=============================================== Initial Execution  ===============================================*/

  socket.query("contracts:active").then(function (games) {
    $scope.games = games;
    /* Prepend '/' for layout development
    var playerNameSelf = "frissdiegurke", groupName = "admins", playerName = "asterix", message = "Kill me please!";
    var gameName1 = "Halloween Massacre", gameName2 = "Game #8128";
    $scope.games = [
      {
        name: gameName1,
        multiGroup: true,
        active: false,
        alias: {name: playerNameSelf, group: {name: groupName}},
        schedule: {end: "2016-01-21T23:00:00.000Z"},
        contracts: [
          {present: false},
          {present: false, resolved: true, survivor: {name: playerName, message: message}},
          {present: false, resolved: true, survivor: null},
          {present: true, resolved: true, survived: true},
          {present: true, resolved: true, survivor: null},
          {present: true, resolved: true, survivor: {name: playerName, message: message}},
          {present: true, dead: true},
          {present: true, dead: false, token: "DEADBEEF", target: {name: playerName, message: message}}
        ]
      },
      {
        name: gameName2,
        multiGroup: false,
        active: true,
        alias: {name: playerNameSelf, group: {name: groupName}},
        schedule: {end: "2016-01-28T23:00:00.000Z"},
        contracts: _.shuffle([
          {present: false},
          {present: false, resolved: true, survivor: {name: playerName, message: message}},
          {present: false, resolved: true, survivor: null},
          {present: true, resolved: true, survived: true},
          {present: true, resolved: true, survivor: null},
          {present: true, resolved: true, survivor: {name: playerName, message: message}},
          {present: true, dead: true},
          {present: true, dead: false, token: "B105F00D", target: {name: playerName, message: message}}
        ])
      }
    ];
    //*/
  });

});
