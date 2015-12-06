angular.module("admin").directive("userList", function () {
  "use strict";

  return {
    restrict: "A",
    scope: {users: "=userList"},
    controller: "userListCtrl",
    templateUrl: "/templates/admin/user_list.html"
  };
});
