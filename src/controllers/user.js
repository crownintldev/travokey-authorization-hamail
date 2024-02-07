const mongoose = require("mongoose");
const {
  handleAsync,
  // listAggregation,
  // createAggregationPipeline,
  aggregationByIds,
  Response,
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

const listAggregation = async (
  req,
  res,
  model,
  createAggregationPipeline,
  customParams
) => {
  try {
    const { searchTerm, sortField, columnFilters, deleted, branch } = req.query;
    let sortOrder = req.query?.sortOrder ? parseInt(req.query?.sortOrder) : -1;
    let columnFiltersArray = [];
    if (columnFilters) {
      columnFiltersArray = JSON.parse(columnFilters);
    }
    let limit = req.query?.limit ? parseInt(req.query?.limit) : 20;
    let page = req.query?.pageNumber ? parseInt(req.query?.pageNumber) : 1;
    let skip = (page - 1) * limit;
    const pipeline = createAggregationPipeline({
      skip,
      limit,
      searchTerm,
      sortField: sortField ? sortField : "createdAt",
      sortOrder: sortOrder ? sortOrder : 1,
      columnFilters: columnFiltersArray,
      deleted: deleted,
      customParams,
      branch,
    });
    // @ts-ignore
    const result = await model.aggregate(pipeline);

    const total = result.length > 0 ? result[0].total : 0;
    const data = result.length > 0 ? result[0].data : [];

    return { total, data };
  } catch (error) {
    console.log(model.modelName, error);
    Response(res, 400, constants.GET_ERROR);
  }
};
const createAggregationPipeline = ({
  skip = 0,
  limit = 100,
  searchTerm = "",
  columnFilters = [],
  deleted = "false",
  sortField = "createdAt",
  sortOrder = -1,
  ids = [],
  customParams,
  branch="65c336d6355c2fc50b106bd0", //without branch id it does not work it is fake id
}) => {
  const { projectionFields, searchTerms, numericSearchTerms } = customParams;
  console.log(branch);
  const lookup = customParams.lookup ? customParams.lookup : [];
  const searching = (field) => {
    return {
      [field]: { $regex: searchTerm, $options: "i" },
    };
  };
  let matchStage = {};

  // if (searchTerm || columnFilters.length > 0) {
  // const numericSearchTerm = Number(searchTerm);
  matchStage = {
    ...(searchTerm && {
      $or: [
        ...(numericSearchTerms.length > 0
          ? numericSearchTerms.map((search) => {
              console.log(search);
              const condition = {};
              condition[search] = Number(searchTerm);
              return condition;
            })
          : []),

        ...(searchTerms.length > 0
          ? searchTerms.map((search) => {
              return searching(search);
            })
          : []),
      ],
    }),
    ...(columnFilters.length > 0 && {
      $and: columnFilters.map((column) => ({
        [column.id]: { $regex: column.value, $options: "i" },
      })),
    }),
    deleted: deleted,
  };
  // }
  if (branch) {
    matchStage.$or = matchStage.$or || [];
    matchStage.$or.push(
      { branch: new mongoose.Types.ObjectId(branch) },
      { branch: branch }
    );
  }
  // data
  let dataPipeline = [];

  
  dataPipeline = dataPipeline.concat([
    { $match: matchStage },
    // {$match:{branch:"65c336d6355c2fc50b106bd2"}},
    {
      $match: {
        _id:
          ids.length > 0
            ? { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
            : { $exists: true },
      },
    },
    // { $match: {branch:  new mongoose.Types.ObjectId("65c336d6355c2fc50b106bd2")}},
    {
      $project: projectionFields,
    },
    { $sort: { [sortField]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
  ]);
  if (lookup) {
    dataPipeline = dataPipeline.concat(...lookup);
  }
  return [
    {
      $facet: {
        total: [{ $count: "count" }],

        data: dataPipeline,
      },
    },
    { $unwind: "$total" },
    { $project: { total: "$total.count", data: "$data" } },
  ];
};

exports.list = handleAsync(async (req, res) => {
  const userId = req.user._id;
  const userListCache = createCache("userListCache");
  // caching
  if (userListCache.has("list")) {
    const { userData, total } = userListCache.get("list");

    return Response(res, 200, "ok", userData, total);
  }

  const { data, total } = await listAggregation(
    req,
    res,
    model,
    createAggregationPipeline,
    customParams
  );
  const userData = data.filter(
    (item) => item._id.toString() !== userId.toString()
  );
  // userListCache.set("list", { userData, total });
  // setTimeout(() => userListCache.delete("list"), 70000); //5m

  Response(res, 200, "ok", userData, total);
}, modelName);

exports.editUserbyAdministrator = handleAsync(async (req, res, next) => {
  const user = req.user;
  const { ids, branch, roles, appPermissions, status } = req.body;
  // console.log(ids,user._id)
  if (appPermissions) {
    if (
      !user.appPermissions.some((permission) =>
        appPermissions.includes(permission)
      )
    ) {
      return Response(
        res,
        400,
        "You can't assign permissions that you are not allowed."
      );
    }
  }
  // if(branch){
  //   if(user.branch !==branch){
  //     return Response(
  //       res,
  //       400,
  //       "You can't assign branch that you are not allowed."
  //     );
  //   }
  // }
  if (ids.includes(user._id)) {
    return Response(
      res,
      400,
      "Administrator can't update his own role, Contact Super Admin"
    );
  }

  const data = { branch, roles, appPermissions, status };
  if (!ids || !ids.length === 0) {
    IsArray(ids, res);
  }
  const result = await model.updateMany(
    { _id: { $in: ids } },
    { $set: data },
    { $new: true }
  );

  if (result) {
    const response = await aggregationByIds({
      model,
      ids: ids,
      customParams,
    });
    return Response(res, 200, `${modelName} Update Successfully`, response);
  }
}, modelName);

exports.updateFieldAll = handleAsync(async (req, res) => {
  const { name } = req.body
  const model = mongoose.model(name)
  await model.updateMany({}, { $set: {deleted:"false"} });
  res.status(200).send(`${name} Documents updated successfully.`)
},"Existing Document")

// for list aggregation pipeline
const lookup = [
  lookupUnwindStage("roles", "roles", "_id", "roles"),
  lookupUnwindStage("branches", "branch", "_id", "branch"),
];
const customParams = {
  lookup,
  projectionFields: {
    _id: 1,
    username: 1,
    email: 1,
    phoneNumber: 1,
    address: 1,
    gender: 1,
    status: 1,
    roles: 1,
    // tokens: 1,
    appPermissions: 1,
    branch: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  searchTerms: ["createdAt", "updatedAt"],
};

exports.customParams = customParams;
