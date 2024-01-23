const mongoose = require("mongoose");
const { defineAbilitiesFor } = require("./casl");
const {
  handleAsync,
  Response,
  lookupStage,
  aggregationByIds,
} = require("@tablets/express-mongoose-api");
const jwt = require("jsonwebtoken");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.requireSignin = handleAsync(async (req, res, next) => {
  const token = req.cookies.jwt;
  const verify = jwt.verify(token, process.env.JWT_SECRET);

  const user = await model
    .findOne({ _id: verify._id })
    .populate("roles")
    .populate("permissions")
    .populate("branches");

  if (!user) {
    return Response(res, 401, "Unauthorized");
  }
  req.user = user;
  next();
}, modelName);

exports.caslAbility = handleAsync(async (req, res, next) => {
  const user = req.user;
  if (
    user.permissions &&
    user.permissions.length > 0 &&
    user.roles &&
    user.roles.length > 0
  ) {
    // Define abilities for the user
    user.abilities = defineAbilitiesFor(user);
  } else {
    return Response(
      res,
      401,
      "You do not have any permission and role assigned"
    );
  }
  next();
}, modelName);

exports.appCheckPost = (appName, collectionName) => (req, res, next) => {
  const user = req.user;
  let permissions = user.permissions.map((item) => item.name);

  if (!permissions.includes(appName)) {
    return Response(res, 401, "You do not have Permission of this App");
  }
  // check roles
  if (collectionName) {
    const roles = user.roles.map((item) => item.name);
    if (roles.includes("manage-all")) {
      next();
    } else {
      const requiredRoles = [
        `${collectionName}-create`,
        `${collectionName}-delete`,
        `${collectionName}-post`,
        `${collectionName}-read`,
      ];
      if (requiredRoles.some((role) => roles.includes(role))) {
        next();
      } else {
        return Response(res, 401, "You do not have Roles of this App");
      }
    }
  } else {
    next();
  }
};
exports.sendParams = (fn, params) => (req, res, next) =>
  fn(req, res, next, params);

exports.checkPermissions = (action, resource) => (req, res, next) => {
  const user = req.user;
  if (!user.abilities.can(action, resource)) {
    return Response(res, 403, "Forbidden");
  }
  next();
};
