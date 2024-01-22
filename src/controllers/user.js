const mongoose = require("mongoose");
const {
  handleAsync,
  constants,
  createApi,
  updateApi,
  aggregationByIds,
  Response,
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
  console.log(updateUser)
  const response = await aggregationByIds({
    model,
    ids: [updateUser._id],
    ownPipeline:createAggregationPipeline
  });
  return Response(res, 200, `${modelName} Update Successfully`, response,);
}, modelName);



const customParams = {
  projectionFields: {
    
  },
  searchTerms: ["email", "createdAt", "updatedAt"],
};

const createAggregationPipeline = ({
  skip,
  limit,
  searchTerm,
  columnFilters,
  ids=[],
  sortField = "createdAt",
  sortOrder = -1,
}) => {
  const searching = (field) => {
    return {
      [field]: { $regex: searchTerm, $options: "i" },
    };
  };
  let matchStage = {};
  if (searchTerm || columnFilters?.length > 0) {
    matchStage = {
      ...(searchTerm && {
        $or: [
          searching("createdAt"),
          searching("updatedAt"),
        ],
      }),
      ...(columnFilters?.length > 0 && {
        $and: columnFilters?.map((column) => ({
          [column.id]: { $regex: column.value, $options: "i" },
        })),
      }),
    };
  }

  
  const lookup = [
    lookupUnwindStage("roles", "roles", "_id", "role"),
    lookupUnwindStage("permissions", "permissions", "_id", "permission"),
    lookupUnwindStage("branches", "branches", "_id", "branch"),
  ]
  
  return [
    {
      $facet: {
        total: [{ $count: "count" }],
        data: [
          ...lookup,
        
          { $match: matchStage },
          {
            $match: {
              _id:
                ids.length > 0
                  ? { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
                  : { $exists: true },
            },
          },
          // {
          //   $group: {
          //     _id: "$_id", 
          //     userName: { $first: "$userName" },
          //     email: { $first: "$email" },
          //     roles: { $push: "$role" }, 
          //     permissions: { $push: "$permission" }, 
          //     branches: { $push: "$branch" }, 
           
          //   }
          // },
          {
            $project: {
              _id: 1,
              userName: 1,
              email: 1,
              phoneNumber: 1,
              address: 1,
              gender: 1,
              status: 1,
              // roles: ["$role"],
              // permissions: ["$permission"],
              // branches: ["$branch"],
              createdAt: 1,
              updatedAt: 1,
            },
          },
          { $sort: { [sortField]: sortOrder } },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
      },
    },
    { $unwind: "$total" },
    { $project: { total: "$total.count", data: "$data" } },
  ];
};

exports.customParams = customParams;
