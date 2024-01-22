const mongoose = require("mongoose");
const { handleAsync } = require("@tablets/express-mongoose-api");
const jwt = require("jsonwebtoken");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.requireSignin = handleAsync(async (req, res, next) => {
  const token = req.cookies.jwt;
  const verify = jwt.verify(token, process.env.JWT_SECRET);
  const user = await model.findOne({ _id: verify._id });
  req.user = user;
  // console.log(user)
  next();
}, modelName);

exports.checkpost =  handleAsync(async (req, res, next) => {
  const user = req.user;
  
  next();
}, modelName);
