angular.module("common").factory("socket", function ($location, $q, $http) {
  "use strict";

  var initialized = $q.defer();
  var connected = $q.defer();
  var authorized = $q.defer();

  var queryId = 0;
  var queryDeferreds = {};
  var queryMessageIds = {};

  var connection = null;

  function queryResolved(queryId) {
    delete queryDeferreds[queryId];
    delete queryMessageIds[queryId];
  }

  function onConnectionEstablished() {
    connection.on("query:response", function (data) {
      queryDeferreds[data.id].resolve(data.response);
      queryResolved(data.id);
    });
    connection.on("query:failed", function (data) {
      console.error("query responded an error", queryMessageIds[data.id], data.reason);
      queryDeferreds[data.id].reject(data.reason);
      queryResolved(data.id);
    });
    connection.on("query:progress", function (data) {
      queryDeferreds[data.id].notify(data.progress);
    });
  }

  function resolveAuth(user) {
    service.identity = user;
    authorized.resolve(user);
    onConnectionEstablished();
  }

  var service = {
    identity: null,

    initialized: initialized.promise,
    connected: connected.promise,
    authorized: authorized.promise,

    connect: function (url) {
      if (connection == null) {
        connection = io.connect(url || "#{$location.protocol()}://#{$location.host()}:#{$location.port()}");
        connection.on("connection:authorized", function (user) {
          user.guest = !!user.guest;
          resolveAuth(user);
        });
        connection.on("connection:established", function () {
          $http.get("/connection/authToken").then(function (res) {
            connected.resolve(res.data.user);
            connection.emit("connection:authorize", {userId: res.data.user._id, token: res.data.token});
          }, function (err) {
            connected.reject(err);
            authorized.reject(err);
          });
        });
        initialized.resolve(service);
      }
      return service.connected;
    },

    on: function (messageId, callback) {
      service.initialized.then(function () { connection.on(messageId, callback); });
    },

    emit: function (messageId, data) {
      return service.authorized.then(function () { return connection.emit(messageId, data); });
    },

    query: function (messageId, data) {
      var defer = $q.defer();
      service.authorized.then(function () {
        var qId = queryId++;
        queryMessageIds[qId] = messageId;
        queryDeferreds[qId] = defer;
        connection.emit("query:send", {id: qId, method: messageId, data: data});
      });
      return defer.promise;
    }
  };

  return service;
});
