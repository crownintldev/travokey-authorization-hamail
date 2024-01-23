const mongoose = require("mongoose");
const {
  handleAsync,
  constants,
  createApi,
  updateApi,
  aggregationByIds,
  Response,
  lookupStage,
  lookupUnwindStage,
} = require("@tablets/express-mongoose-api");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.update = handleAsync(async (req, res) => {
  const user = req.user;
  const data = req.body;
  let { password } = data;
  if (password) {
    await user.hashing();
  }
  await user.generateAuthToken(req);
  Object.assign(user, data);
  const updateUser = await user.save();

  const response = await aggregationByIds({
    model,
    ids: [updateUser._id],
    customParams,
  });
  return Response(res, 200, `${modelName} Update Successfully`, response);
}, modelName);

// for list aggregation pipeline
const lookup = [
  lookupStage("roles", "roles", "_id", "roles"),
  lookupStage("permissions", "permissions", "_id", "permissions"),
  lookupStage("branches", "branches", "_id", "branches"),
];
const customParams = {
  lookup,
  projectionFields: {
    _id: 1,
    userName: 1,
    email: 1,
    phoneNumber: 1,
    address: 1,
    gender: 1,
    status: 1,
    roles: 1,
    tokens:1,
    permissions: 1,
    branches: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  searchTerms: ["createdAt", "updatedAt"],
};

exports.customParams = customParams;
