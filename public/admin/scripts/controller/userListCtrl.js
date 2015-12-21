angular.module("admin").controller("userListCtrl", function ($scope, $rootScope, users) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.toggleAdmin = toggleAdmin;
  $scope.removeUser = removeUser;
  $scope.isSelf = function (user) { return $rootScope.identity && user._id === $rootScope.identity._id; };

  /*=================================================== Functions  ===================================================*/

  function removeUser(user) {
    user.saving = true;
    users
        .remove(user._id)
        .then(function () {
          var idx = _.indexOf($scope.users, user);
          if (~idx) { $scope.users.splice(idx, 1); }
        }, function (err) {
          console.log(err);
          delete user.saving;
        });
  }

  function toggleAdmin(user) {
    var admin = !user.admin;
    user.saving = true;
    users
        .update({_id: user._id, admin: admin})
        .then(function () {
          user.admin = admin;
          delete user.saving;
        }, function (err) {
          console.error(err);
          delete user.saving;
        });
  }

});
