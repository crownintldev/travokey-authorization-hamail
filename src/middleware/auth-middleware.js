const mongoose = require("mongoose");
const { defineAbilitiesFor } = require("./casl");
const { handleAsync, Response } = require("@tablets/express-mongoose-api");
const jwt = require("jsonwebtoken");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.requireSignin = handleAsync(async (req, res, next) => {
  const token = req.cookies.jwt;
  const verify = jwt.verify(token, process.env.JWT_SECRET);
  const user = await model.findOne({ _id: verify._id });
  // console.log(user)
  if (!user) {
    return Response(res, 401, "Unauthorized");
  }
  req.user = user;
  next();
}, modelName);

exports.caslAbility = handleAsync(async (req, res) => {
  const user = req.user;
  if (
    user.Permission &&
    user.permission.length > 0 &&
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
}, modelName);

exports.checkpost = handleAsync(async (req, res, next) => {
  const user = req.user;
  if (!user.Permission.includes("your app")) {
    return Response(res, 401, "You do not have Permission of this App");
  }
  next();
}, modelName);
