// @ts-check
const model = require("../models/branch");

const {
  removeMany,
  createApi,
  updateApi,
  softRemoveShowStatus,
  listCommonAggregationFilterize,
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
  listCommonAggregationFilterize(
    req,
    res,
    model,
    createAggregationPipeline,
    customParams
  );
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
  console.log(branch)
  res.json(branch);
}, modelName);

// exports.softRemove = async (req, res) => {
//   await softRemoveShowStatus({ req, res, model: model, status: false });
// };

// exports.softRemoveUndo = async (req, res) => {
//   softRemoveShowStatus({ req, res, model: model, status: true });
// };

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
