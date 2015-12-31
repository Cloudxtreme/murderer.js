angular.module("admin").controller("newGameCtrl", function ($scope, $timeout, $uibModalInstance, adminModals, adminGames, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.passwordsText = "";
  $scope.game = {
    name: null,
    description: null,
    groups: [], // {group: Group._id, users: [{user: User._id, name: "", message: ""}]}
    passwords: [], // [""]
    inviteOnly: false,
    limit: {
      participants: null,
      invitedParticipants: null
    },
    startMeta: {
      rings: 6,
      lives: 4
    },
    schedule: {
      end: null,
      start: null//,
      //activate: [], // [Date]
      //deactivate: [] // [Date]
    }
  };
  $scope.now = new Date().toISOString();

  $scope.dismiss = $uibModalInstance.dismiss;
  $scope.confirm = confirm;
  $scope.containsGroup = function (arr, group) { return _.any($scope.game.groups, {group: group._id}); };
  $scope.addGroup = function (arr, group) { arr.push({group: group._id}); };
  $scope.remove = function (arr, index) { arr.splice(index, 1); };
  $scope.moveDown = function (arr, index) { arr.splice(index, 2, arr[index + 1], arr[index]); };
  $scope.moveUp = function (arr, index) { $scope.moveDown(arr, index - 1); };
  $scope.markdownModal = adminModals.markdownPreview;

  $scope.$watch("game.schedule.start", function (value) {
    // fix angular datetime-local validation ignoring that no required is set
    if (value == null) { $timeout(function () { $scope.createForm.gameStart.$setValidity("datetimelocal", true); }); }
  });

  /*=============================================== Initial Execution  ===============================================*/

  /*------------------------------------------------ Fetch all groups ------------------------------------------------*/

  socket
      .query("groups:all")
      .then(function (groups) {
        var g = $scope.groups = {}; // apply map of groups by id to scope
        $scope.groupsList = _.each(groups, function (group) { g[group._id] = group; });
      });

  /*=================================================== Functions  ===================================================*/

  function confirm() {
    var game = $scope.game, pwText = $scope.passwordsText;
    game.passwords = pwText ? _.compact(_.map(pwText.split(","), trimmedOrNull)) : null;
    return adminGames.create(game)
        .then($uibModalInstance.close, function (err) {
          // TODO proper error handling
          console.error(err);
        });
  }

  function trimmedOrNull(s) { return s && s.trim() || null; }

});
