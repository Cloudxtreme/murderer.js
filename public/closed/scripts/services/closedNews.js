angular.module("closed").factory("closedNews", function (socket) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    toggleUpVote: toggleUpVote,

    prepareNews: prepareNews
  };

  /*----------------------------------------------------- Return -----------------------------------------------------*/

  return service;

  /*=================================================== Functions  ===================================================*/

  function toggleUpVote(murder) {
    socket
        .query("murder:upVote", murder._id)
        .then(function (votes) {
          murder.mayUpVote = !(murder.hasUpVoted = !murder.hasUpVoted);
          murder.upVotes = votes;
        });
  }

  function prepareNews(news) {
    if (news.isMurder) {
      news.mayUpVote = !news.hasUpVoted;
    }
  }

});
