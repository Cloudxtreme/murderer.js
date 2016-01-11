angular.module("closed").factory("closedNews", function (socket) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    toggleUpVote: toggleUpVote
  };

  /*----------------------------------------------------- Return -----------------------------------------------------*/

  return service;

  /*=================================================== Functions  ===================================================*/

  function toggleUpVote(murder) {
    if (!murder.mayUpVote) { return; }
    socket
        .query("murder:upVote", murder._id)
        .then(function (votes) {
          murder.hasUpVoted = !murder.hasUpVoted;
          murder.upVotes = votes;
        });
  }

});
