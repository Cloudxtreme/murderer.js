angular.module("open").controller("registerCtrl", function ($scope) {
  "use strict";

  $scope.groups = [
    {id: 0, name: "Zsh"},
    {id: 1, name: "Perl"},
    {id: 2, name: "Lisp"},
    {id: 3, name: "Python"}
  ];

  $scope.selectedGroup = null;

});
