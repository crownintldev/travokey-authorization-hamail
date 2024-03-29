// @ts-check
const Permission = require("../models/permission");

const {
  removeMany,
  createApi,
  updateApi,
  softRemoveShowStatus,
  listCommonAggregationFilterize,
  createAggregationPipeline,
  handleAsync,
  constants,
  Response
} = require("@tablets/express-mongoose-api");

let model = Permission;
let modelName = model.modelName;

exports.create = handleAsync(async (req, res) => {
  const { name } = req.body;
  // req.body destructuring
  const data = { name };

   const response = await createApi(model, data);
  return Response(res, 200, `${modelName} Create Successfully`, [response], 1);
}, modelName);

exports.read = async (req, res) => {
  const id = req.params.id;
  try {
    const permission = await model.findById(id);
    res.json( permission );
  } catch (error) {
    Response(res, 400, constants.GET_ERROR);
  }
};

exports.list = async (req, res) => {
  listCommonAggregationFilterize(req, res, model, createAggregationPipeline,customParams);
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
    searchTerms: [
      "name",
      "createdAt",
      "updatedAt",
    ],
  };
  
