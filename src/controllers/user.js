const mongoose = require("mongoose");
const {
  handleAsync,
  constants,
  createApi,
  updateApi,
  updateManyRecords,
  listCommonAggregationFilterize,
  listAggregation,
  createAggregationPipeline,
  aggregationByIds,
  Response,
  lookupStage,
  lookupUnwindStage,
  IsArray,
  createCache,
} = require("@tablets/express-mongoose-api");

const { hashing } = require("../models/user");

const modelName = "User";
const model = mongoose.model(`${modelName}`);

exports.update = handleAsync(async (req, res) => {
  const userId = req.user._id;
  const data = req.body;
  let { password, roles, appPermissions, status } = data;
  const user = await model.findById(userId);
  // if (branch) {
  //   data.branch = user.branch;
  // }
  if (roles) {
    data.roles = user.roles;
  }
  if (appPermissions) {
    data.appPermissions = user.appPermissions;
  }
  if (status) {
    data.status = user.status;
  }
  if (password) {
    await model.hashing(data);
  }
  await user.generateAuthToken(req, res);
  Object.assign(user, data);
  const updateUser = await user.save();
  const response = await aggregationByIds({
    model,
    ids: [updateUser._id],
    customParams,
  });
  return Response(res, 200, `${modelName} Update Successfully`, response);
}, modelName);

exports.list = handleAsync(async (req, res) => {
  const userListCache = createCache("userListCache");
  // caching
  if (userListCache.has("list")) {
    const { data, total } = userListCache.get("list");
    return Response(res, 200, "ok", data, total);
  }
  const { data, total } = await listAggregation(
    req,
    res,
    model,
    createAggregationPipeline,
    customParams
  );
  userListCache.set("list", { data, total });
  setTimeout(() => userListCache.delete("list"), 70000); //5m

  Response(res, 200, "ok", data, total);
}, modelName);

const isArrays = (res, data, next) => {
  if (!data && res) {
    return res.send("error");
  }
  // if (!data || !Array.isArray(data) || data.length === 0) {
  //   return Response(res, 400, "Not Found Ids");
  // }
};

exports.editUserbyAdministrator = handleAsync(async (req, res, next) => {
  const user = req.user;
  const { ids, branch, roles, permissions, status } = req.body;
  const data = { branch, roles, permissions, status };
  if (!ids || !ids.length === 0) {
    IsArray(ids, res);
  }
  updateManyRecords({ ids, model, data });
  const response = await aggregationByIds({
    model,
    ids: [updateUser._id],
    customParams,
  });
  if (response) {
    return Response(res, 200, `${modelName} Update Successfully`);
  }
}, modelName);

// for list aggregation pipeline
const lookup = [
  lookupStage("roles", "roles", "_id", "roles"),
  lookupUnwindStage("branches", "branch", "_id", "branch"),
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
    tokens: 1,
    appPermissions: 1,
    branch: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  searchTerms: ["createdAt", "updatedAt"],
};

exports.customParams = customParams;
