const mongoose = require("mongoose");
const {
  handleAsync,
  listAggregation,
  // createAggregationPipeline,
  aggregationByIds,
  Response,
  lookupUnwindStage,
  IsArray,
  createCache,
  removeMany,
  removeUndefined
} = require("@tablets/express-mongoose-api");



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

// const listAggregation = async (
//   req,
//   res,
//   model,
//   createAggregationPipeline,
//   customParams
// ) => {
//   try {
//     const { searchTerm, sortField, columnFilters, deleted, branch } = req.query;
//     let sortOrder = req.query?.sortOrder ? parseInt(req.query?.sortOrder) : -1;
//     let columnFiltersArray = [];
//     if (columnFilters) {
//       columnFiltersArray = JSON.parse(columnFilters);
//     }
//     let limit = req.query?.limit ? parseInt(req.query?.limit) : 20;
//     let page = req.query?.pageNumber ? parseInt(req.query?.pageNumber) : 1;
//     let skip = (page - 1) * limit;
//     const pipeline = createAggregationPipeline({
//       skip,
//       limit,
//       searchTerm,
//       sortField: sortField ? sortField : "createdAt",
//       sortOrder: sortOrder ? sortOrder : 1,
//       columnFilters: columnFiltersArray,
//       deleted: deleted,
//       customParams,
//       branch,
//     });
//     // @ts-ignore
//     const result = await model.aggregate(pipeline);

//     const total = result.length > 0 ? result[0].total : 0;
//     const data = result.length > 0 ? result[0].data : [];

//     return { total, data };
//   } catch (error) {
//     console.log(model.modelName, error);
//     Response(res, 400, constants.GET_ERROR);
//   }
// };


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

// const aggregationById = async ({ model, ids, customParams, ownPipeline,req }) => {
//   // find id required branch and ids
//   const user = req.user;
//   const document = ids && ids?.length ? ids : [ids];
//   let pipeline;
//   if (customParams) {
//     // @ts-ignore
//     pipeline = createAggregationPipeline({
//       ids: document,
//       customParams,
//       branch: req.body.branch ?? user.branch._id,
//     });
//   } else if (ownPipeline) {
//     // @ts-ignore
//     pipeline = ownPipeline({ ids: document });
//   }

//   // @ts-ignore
//   const aggregateResult = await model.aggregate(pipeline);
//   const response = aggregateResult.length > 0 ? aggregateResult[0].data : [];
//   return response;
// };

exports.editUserbyAdministrator = handleAsync(async (req, res, next) => {
  const user = req.user;
  const { ids, branch, roles, appPermissions, status,password } = req.body;
  // console.log(ids,user._id)
  if (appPermissions) {
    // only those pemission can assign that administrator have.
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

  if (ids.includes(user._id)) {
    return Response(
      res,
      400,
      "Administrator can't update his own role, Contact Super Admin"
    );
  }
 
  let data = { branch, roles, appPermissions, status,password };
  if (password) {
    await model.hashing(data);
  }
  
  removeUndefined(data)
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
      req
    });
    return Response(res, 200, `${modelName} Update Successfully`, response);
  }
}, modelName);

exports.remove = async (req, res) => {
  console.log("dfgfdgdfgdfgdfg")
  await removeMany(req, res, model);
};
exports.updateFieldAll = handleAsync(async (req, res) => {
  const { name } = req.body;
  const model = mongoose.model(name);
  await model.updateMany({}, { $set: { deleted: "false" } });
  res.status(200).send(`${name} Documents updated successfully.`);
}, "Existing Document");

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
    // address: 1,
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
  branch = "65c336d6355c2fc50b106bd0", // it is fake id, without branch id it does not work
}) => {
  const { projectionFields, searchTerms, numericSearchTerms } = customParams;
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
  // if (branch) {
  //   matchStage.$or = matchStage.$or || [];
  //   matchStage.$or.push(
  //     { branch: new mongoose.Types.ObjectId(branch) },
  //     { branch: branch }
  //   );
  // }
  // data
  let dataPipeline = [];
  if (lookup) {
    dataPipeline = dataPipeline.concat(...lookup);
  }
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
 

  let countPipeline = [{ $match: matchStage }, { $count: "count" }];
  return [
    {
      $facet: {
        totalAll: [{ $count: "count" }],
        total: countPipeline,
        data: dataPipeline,
      },
    },
    { $unwind: "$total" },
    { $project: { total: "$total.count", data: "$data" } },
  ];
};

exports.createAggregationPipeline = createAggregationPipeline;
exports.customParams = customParams;
