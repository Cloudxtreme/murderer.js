angular.module("admin").controller("groupsCtrl", function ($scope, $timeout, groups) {
  "use strict";

  var originGroups = {}, groupKeys = ["_id", "name", "description"];

  /*===================================================== Scope  =====================================================*/

  $scope.groups = null;

  $scope.newGroup = {};

  $scope.createGroup = createGroup;
  $scope.editGroup = editGroup;
  $scope.revertGroup = revertGroup;
  $scope.saveGroup = saveGroup;
  $scope.removeGroup = removeGroup;

  /*=============================================== Initial Execution  ===============================================*/

  groups.all().then(function (list) { $scope.groups = list; });

  /*=================================================== Functions  ===================================================*/

  function createGroup() {
    groups
        .create($scope.newGroup)
        .then(function (group) { $scope.groups.unshift(group); });
  }

  function editGroup(group) {
    originGroups[group._id] = _.clone(group);
    group.editing = true;
  }

  function removeGroup(group) { // TODO confirm dialog if in use within any game
    group.saving = true;
    groups
        .remove(group._id)
        .then(function () {
          var idx = _.indexOf($scope.groups, group);
          if (~idx) { $scope.groups.splice(idx, 1); }
        }, function () { delete group.saving; });
  }

  function revertGroup(group) {
    delete group.editing;
    _.extend(group, originGroups[group._id]);
    delete originGroups[group._id];
  }

  function saveGroup(group) {
    group.saving = true;
    delete group.editing;
    groups
        .update(_.pick(group, groupKeys))
        .then(function () {
          delete group.saving;
          delete originGroups[group._id];
        }, function () {
          revertGroup(group);
          delete group.saving;
        });
  }

});
