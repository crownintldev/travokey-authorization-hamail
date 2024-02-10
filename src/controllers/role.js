// @ts-check
const Role = require("../models/role");

const {
  removeMany,
  createApi,
  updateApi,
  softRemoveShowStatus,
  listCommonAggregationFilterize,
  aggregationByIds,
  // createAggregationPipeline,
  lookupUnwindStage,
  handleAsync,
  constants,
  Response,
  listAggregation,
} = require("@tablets/express-mongoose-api");
const mongoose = require("mongoose")

let model = Role;
let modelName = model.modelName;

exports.create = handleAsync(async (req, res) => {
  const user = req.user;
  const { appPermissions } = req.body;
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
  const role = await createApi(model, req.body);
  const response = await aggregationByIds({
    model,
    ids: [role._id],
    customParams,
  });
  return Response(res, 200, "Agent Create Successfully", response, 1);
}, modelName);

exports.read = async (req, res) => {
  const id = req.params.id;
  try {
    const role = await model.findById(id);
    res.json(role);
  } catch (error) {
    Response(res, 500, constants.GET_ERROR);
  }
};

exports.list = async (req, res) => {
  // @ts-ignore
  const {data,total}=await listAggregation(
    req,
    res,
    model,
    createAggregationPipeline,
    customParams
  );
  return Response(res,200,"ok",data,total)
};

exports.update = handleAsync(async (req, res) => {
  const id = req.params.id;
  const role = await updateApi(model, id, req.body);
  const response = await aggregationByIds({ model, ids: [role._id], customParams });
  return Response(res, 200, "ok", response);
}, modelName);

exports.remove = async (req, res) => {
  await removeMany(req, res, model);
};

// for list aggregation pipeline

const customParams = {
  projectionFields: {
    _id: 1,
    title: 1,
    list: 1,
    chooseApp: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  searchTerms: ["name", "permission.name", "createdAt", "updatedAt"],
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
  // @ts-ignore
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
  //     { "branch._id": branch }
  //   );
  // }
  // data
  let dataPipeline = [];

  dataPipeline = dataPipeline.concat([
    { $match: matchStage },
    // { $match: { show: { $ne: showRemove } } },
    {
      $match: {
        _id:
          ids.length > 0
            ? { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
            : { $exists: true },
      },
    },
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

