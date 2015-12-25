/*
 * This service provides communication capability between the client and server (and reverse).
 * The connect() function needs to be called on bootstrapping in order to initiate the service.
 *
 * Note: This service can only manage one connection to a server. Multiple calls of connect() will be ignored.
 */
angular.module("common").factory("socket", function ($location, $q, $http) {
  "use strict";

  var queryId = 0;
  var queryDeferreds = {};
  var queryMessageIds = {};
  var initialized = $q.defer();
  var connected = $q.defer();
  var identified = $q.defer();
  var authorized = $q.defer();

  var connection = null;

  /*==================================================== Exports  ====================================================*/

  var service = {
    identity: null,
    promises: {
      /**
       * Resolves once the WebSocket connection is created (Connection step #1 is done).
       */
      initialized: initialized.promise,
      /**
       * Resolves once the WebSocket connection to the server is established (Connection step #2 is done).
       */
      connected: connected.promise,
      /**
       * Resolves once the identity of the client got resolved by the server (Connection step #4 is done).
       * Resolve value is the user object.
       */
      identified: identified.promise,
      /**
       * Resolves once the identity of the user is authenticated (Connection step #7 is done).
       * Resolve value is the user object. Each guest gets assigned a user object too.
       */
      authorized: authorized.promise
    },

    connect: connect,
    on: attachMessageListener,
    emit: emitMessage,
    query: emitQuery
  };

  return service;

  /*=================================================== Functions  ===================================================*/

  /*--------------------------------------------------- Connection ---------------------------------------------------*/

  /**
   * Connection Steps:
   *  1. io.connect()
   *  2. server sends 'established' once set-up
   *  3. client sends http request to get authenticated
   *  4. server responds with user object and token for socket-association
   *  5. client sends token to associate the socket with the user
   *  6. server authorizes socket connection and sends 'authorized'
   *  7. client creates listener for service-internal messages to provide query method
   *
   * @param {string} [url] The url to create the connection - see {@link Socket.connect}.
   * @return {Q} {@link service.promises.connected}
   */
  function connect(url) {
    if (connection == null) {
      if (url == null) { url = $location.protocol() + "://" + $location.host() + ":" + $location.port(); }
      connection = io.connect(url);
      connection.on("connection:error.401", on401);
      connection.on("connection:authorized", onAuthorized);
      connection.on("connection:established", onEstablished);
      initialized.resolve();
    }
    return connected.promise;
  }

  // TODO better error handling (via alerts, retry button)
  function on401() { console.error("Socket connection authorization failed."); }

  function onAuthorized() {
    setupQueryListeners();
    authorized.resolve(service.identity);
  }

  function onEstablished() {
    connected.resolve();
    $http.get("/connection/authToken").then(function (res) {
      var user = res.data.user;
      user.guest = !!user.guest;
      identified.resolve(service.identity = user);
      connection.emit("connection:authorize", {userId: res.data.user._id, token: res.data.token});
    }, function (err) {
      identified.reject(err);
      authorized.reject(err);
    });
  }

  function queryResolved(queryId) {
    delete queryDeferreds[queryId];
    delete queryMessageIds[queryId];
  }

  /*---------------------------------------------------- Queries  ----------------------------------------------------*/

  function setupQueryListeners() {
    connection.on("query:failed", onQueryFailed);
    connection.on("query:progress", onQueryProgress);
    connection.on("query:response", onQueryResponse);
  }

  function onQueryFailed(data) {
    console.warn("query '" + queryMessageIds[data.id] + "' responded an error:", data.reason);
    queryDeferreds[data.id].reject(data.reason);
    queryResolved(data.id);
  }

  function onQueryProgress(data) {
    queryDeferreds[data.id].notify(data.progress);
  }

  function onQueryResponse(data) {
    queryDeferreds[data.id].resolve(data.response);
    queryResolved(data.id);
  }

  function emitQuery(messageId, data) {
    var defer = $q.defer();
    authorized.promise.then(function () {
      var qId = queryId++;
      queryMessageIds[qId] = messageId;
      queryDeferreds[qId] = defer;
      connection.emit("query:send", {id: qId, method: messageId, data: data});
    });
    return defer.promise;
  }

  /*------------------------------------------------------ Misc ------------------------------------------------------*/

  function attachMessageListener(messageId, callback) {
    initialized.promise.then(function () { connection.on(messageId, callback); });
  }

  function emitMessage(messageId, data) {
    return authorized.promise.then(function () { return connection.emit(messageId, data); });
  }

});
