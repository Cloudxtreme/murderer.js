angular.module("common").constant("CREDENTIALS", {
  username: {min: 3, regex: /^[a-zA-Z][\w\d]{2,}$/},
  password: {min: 6}
});
