// https://chat.openai.com/share/3a39991b-4429-46eb-809f-a4bd0c726377
const mongoose = require("mongoose");
const {
  handleAsync,
  constants,
  Response,
} = require("@tablets/express-mongoose-api");

const { customParams, createAggregationPipeline } = require("./user");
const { expressjwt: expressJwt } = require("express-jwt"); // for authorization
const jwt = require("jsonwebtoken");
const passport = require("passport");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.signup = handleAsync(async (req, res) => {
  const data = req.body;
  let { password, roles, permissions, status } = data;
  if (password) {
    await model.hashing(data);
  }
  const api = new model(data);
  const signUser = await api.save();
  if (signUser._id) {
    const pipeline = createAggregationPipeline({
      ids: [signUser._id],
      customParams,
    });
    const aggregateResult = await model.aggregate(pipeline);
    const response = aggregateResult.length > 0 ? aggregateResult[0].data : [];
    return Response(res, 200, `${modelName} Create Successfully`, response);
  }
}, modelName);

exports.me = handleAsync(async (req, res) => {
  // const token = req.header("authorization");
  let token;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.header("authorization")) {
    token = req.header("authorization").split(" ")[1];
  }
  const user = req.user;
  const { tokens, ...otherfield } = user;

  return Response(res, 201, constants.USER_LOGIN_SUCCESS, otherfield, 1, {
    accessToken: token,
  });
}, modelName);

exports.signin = handleAsync(async (req, res, next) => {
  const data = req.body;
  passport.authenticate("local", {}, (err, user) => {
    if (err || !user) {
      return Response(res, 401, constants.EMAIL_PASSWORD_ERROR);
    }
    req.logIn(user, async (err) => {
      if (err) {
        return Response(res, 500, "Internal Server Error");
      }
      const accessToken = await user.generateAuthToken(req, res);
      const signUser = await user.save();
      const {_id,username,password,email,status,roles,appPermissions,branch,deleted} = signUser;
      const data={_id,username,password,email,status,roles,appPermissions,branch,deleted};
      return Response(res, 201, constants.USER_LOGIN_SUCCESS, data, 1, {
        accessToken,
      });
    });
  })(req, res, next);
}, modelName);

exports.logout = handleAsync(async (req, res) => {
  const user = req.user;
  const tokenToRemove = req.cookies.jwt;
  await model.updateOne(
    { _id: user._id },
    { $pull: { tokens: { token: tokenToRemove } } }
  );

  res.clearCookie("jwt");
  return Response(res, 200, "Logout successful");
});

exports.logoutalldevices = handleAsync(async (req, res) => {
  const user = req.user;
  user.tokens.forEach((token) => {
    res.clearCookie("jwt", { token: token.token }); // Assuming "jwt" is the cookie name
  });
  user.tokens = [];
  await user.save();

  return Response(res, 200, "Logout successful");
}, modelName);

// In your main app
exports.getUserFromToken = async (req, res) => {
  try {
    const token = req.body.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await model
      .findOne({ _id: decoded._id, "tokens.token": { $in: token } })
      .populate("roles")
      .populate("branch")
      .select("-tokens");

    if (!user) {
      return Response(res, 401, "unauthorized");
    }
    res.json(user);
  } catch (error) {
    return Response(res, 401, "Invalid Token");
  }
};

exports.test = (req, res) => {
  const user = req.user;
  // if (!user.abilities.can("create", "testing")) {
  //   return Response(res, 403, "Forbidden");
  // }
  return Response(res, 200, "Test OK");
};
