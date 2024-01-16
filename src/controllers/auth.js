// https://chat.openai.com/share/3a39991b-4429-46eb-809f-a4bd0c726377
const mongoose = require("mongoose");
const {
  handleAsync,
  constants,
  createApi,
  updateApi,
  Response,
} = require("@tablets/express-mongoose-api");
const { expressjwt: expressJwt } = require("express-jwt"); // for authorization
const jwt = require("jsonwebtoken");
const passport = require("passport");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.signup = handleAsync(async (req, res) => {
  const data = req.body;
  const response = await createApi(model, data);
  return Response(res, 200, `${modelName} Create Successfully`, [response], 1);
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
      user.tokenVersion += 1;
      const token = jwt.sign(
        { _id: user._id, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET,
        {
          expiresIn: "9d",
        }
      );
      res.cookie("token", token, { httpOnly: true });
    const response =   await updateApi(model, user._id, { tokenVersion: user.tokenVersion });
      const userdata = { token, response };
      console.log(userdata)
      return Response(res, 201, constants.USER_LOGIN_SUCCESS, userdata);
    });
  })(req, res, next);
}, modelName);

exports.logoutalldevices = handleAsync(async (req, res) => {
  console.log(req.auth);
  req.auth.tokenVersion += 1; // Use req.auth instead of req.user
  const response =   await updateApi(model, req.auth._id, { tokenVersion: req.auth.tokenVersion });
  return Response(res, 200, "Logout successful");
});

exports.test = (req, res) => {
  console.log(req.cookies)
  Response(res, 200, "Test OK");
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth",
  algorithms: ["HS256"],
  getToken: (req) => {
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split("; ");
      const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));

      if (tokenCookie) {
        return tokenCookie.split("=")[1];
      }
    }

    return null;
  },
  isRevoked: async (req, payload, done) => {
    try {
      const user = await model.findById(payload._id);
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        // Token is revoked, deny access
        return false;
      }

      // Token is valid, allow access
      return true;
    } catch (error) {
      // Error occurred, deny access
      return false;
    }
  },
});
