// @ts-check
const { default: mongoose } = require("mongoose");
const model = require("../models/branch");

const {
  removeMany,
  createApi,
  updateApi,
  softRemoveShowStatus,
  listCommonAggregationFilterize,
  listAggregation,
  createAggregationPipeline,
  handleAsync,
  constants,
  Response,
} = require("@tablets/express-mongoose-api");

let modelName = model.modelName;

exports.create = handleAsync(async (req, res) => {
  const { name, status } = req.body;
  // req.body destructuring
  const data = { name, status };

  const response = await createApi(model, data);
  return Response(res, 200, `${modelName} Create Successfully`, [response], 1);
}, modelName);

exports.read = async (req, res) => {
  const id = req.params.id;
  try {
    const branch = await model.findById(id);
    res.json(branch);
  } catch (error) {
    Response(res, 400, constants.GET_ERROR);
  }
};

exports.list = async (req, res) => {
  // @ts-ignore
  const { data, total } = await listAggregation(
    req,
    res,
    model,
    branchAggregation,
    customParams
  );
  Response(res, 200, "ok", data, total);
};

exports.update = handleAsync(async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const response = await updateApi(model, id, data);
  return Response(res, 200, "ok", [response]);
}, modelName);

exports.remove = async (req, res) => {
  await removeMany(req, res, model);
};

exports.checkBranchExist = handleAsync(async (req, res, next) => {
  const id = req.params.id;
  const branch = await model.findOne({ _id: id });
  res.json(branch);
}, modelName);

// for list aggregation pipeline
const customParams = {
  projectionFields: {
    _id: 1,
    name: 1,

    createdAt: 1,
    updatedAt: 1,
  },
  searchTerms: ["name", "createdAt", "updatedAt"],
};

const branchAggregation = ({
  skip = 0,
  limit = 100,
  searchTerm = "",
  columnFilters = [],
  sortField = "createdAt",
  sortOrder = -1,
  ids = [],
  customParams,
}) => {
  const { projectionFields, searchTerms, numericSearchTerms } = customParams;
  const searching = (field) => {
    return {
      [field]: { $regex: searchTerm, $options: "i" },
    };
  };
  let matchStage = {};
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
  };
  return [
    {
      $facet: {
        total: [{ $count: "count" }],
        data: [
          { $match: matchStage },
          {
            $match: {
              _id:
                ids.length > 0
                  ? { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
                  : { $exists: true },
            },
          },
          { $project: projectionFields },
          { $sort: { [sortField]: sortOrder } },
          { $skip: skip },
          { $limit: limit },
        ],
      },
    },
    { $unwind: "$total" },
    { $project: { total: "$total.count", data: "$data" } },
  ];
};
