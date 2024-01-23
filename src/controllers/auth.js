// https://chat.openai.com/share/3a39991b-4429-46eb-809f-a4bd0c726377
const mongoose = require("mongoose");
const {
  handleAsync,
  constants,
  aggregationByIds,
  Response,
} = require("@tablets/express-mongoose-api");
const {customParams} = require("./user")
const { expressjwt: expressJwt } = require("express-jwt"); // for authorization
const jwt = require("jsonwebtoken");
const passport = require("passport");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.signup = handleAsync(async (req, res) => {
  const data = req.body;
  
  const api = new model(data);
  await api.hashing();
  await api.generateAuthToken(req);
  const signUser = await api.save();
  const response =  await aggregationByIds({model,ids:[signUser._id],customParams})
  return Response(res, 200, `${modelName} Create Successfully`, response);
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
      const token = await user.generateAuthToken(req);
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      });

      const signUser = await user.save();
     const response =  await aggregationByIds({model,ids:[signUser._id],customParams})
      return Response(res, 201, constants.USER_LOGIN_SUCCESS, response);
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

exports.test = (req, res) => {
  const user = req.user;
  // if (!user.abilities.can("create", "testing")) {
  //   return Response(res, 403, "Forbidden");
  // }
  return Response(res, 200, "Test OK");
};
exports.me = (req, res) => {
  return Response(res, 200, "Test Me OK");
};



