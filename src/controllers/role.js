// @ts-check
const Role = require("../models/role");

const {
  removeMany,
  createApi,
  updateApi,
  softRemoveShowStatus,
  listCommonAggregationFilterize,
  aggregationByIds,
  createAggregationPipeline,
  lookupUnwindStage,
  handleAsync,
  constants,
  Response,
} = require("@tablets/express-mongoose-api");

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
  return Response(res, 200, "Agent Create Successfully", [response], 1);
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
  listCommonAggregationFilterize(
    req,
    res,
    model,
    createAggregationPipeline,
    customParams
  );
};

exports.update = handleAsync(async (req, res) => {
  const id = req.params.id;
  const role = await updateApi(model, id, req.body);
  const response = aggregationByIds({ model, ids: [role._id], customParams });
  return Response(res, 200, "ok", [response]);
}, modelName);

exports.remove = async (req, res) => {
  removeMany(req, res, model);
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
    title: 1,
    list: 1,
    chooseApp: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  searchTerms: ["name", "permission.name", "createdAt", "updatedAt"],
};
