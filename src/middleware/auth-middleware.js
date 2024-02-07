const axios = require("axios");
// const { defineAbilitiesFor } = require("./casl");
// const { createCache } = require("./node-cache");
const {
  handleAsync,
  Response,
  createCache,
} = require("@tablets/express-mongoose-api");
const jwt = require("jsonwebtoken");

exports.requireSignin = handleAsync(async (req, res, next) => {
  const userCache = createCache("userCache");
  let token;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.header("authorization")) {
    token = req.header("authorization").split(" ")[1];
  }
  const verify = jwt.verify(token, process.env.JWT_SECRET);
  if (!verify) {
    return Response(res, 401, "Unauthorized");
  }
  // caching
  if (userCache.has(token)) {
    req.user = userCache.get(token);
    return next();
  }
  const response = await axios.post(
    `${process.env.AUTHAPI}/auth/getUserFromToken`,
    { token }
  );
  const user = response?.data;

  if (!user) {
    return Response(res, 401, "Unauthorized");
  }
  if (!user.status || user?.status !== "active") {
    return Response(
      res,
      400,
      "Your Account is not Active! *Contact Administrator*"
    );
  }
  // Cache the user data for a short period
  userCache.set(token, user);
  setTimeout(() => userCache.delete(token), 600000);

  req.user = user;
  next();
}, "User");

exports.appCheckPost = (appName) => async (req, res, next) => {
  const user = req.user;
  let userPermissions = user?.appPermissions ?? [];
  if (!userPermissions.includes(appName)) {
    return Response(res, 401, "You do not have Permission of this App");
  } else {
    next();
  }
};

exports.modelCheckPost = (collectionName) => async (req, res, next) => {
  const user = req.user;
  // Check roles
  if (collectionName) {
    if (!user.roles || !user.roles.list) {
      return Response(res, 401, "You do not have Roles of this App ---");
    }
    const rolesList = user.roles?.list.map((item) => item);
    if (!rolesList.includes("manage-all")) {
      // const requiredRoles = [
      //   `${collectionName}-create`,
      //   `${collectionName}-delete`,
      //   `${collectionName}-post`,
      //   `${collectionName}-read`,
      // ];
      // if (!requiredRoles.some((role) => roles.includes(role))) {
      //   return Response(res, 401, "You do not have Roles of this App");
      // }
      if (!rolesList.includes(collectionName)) {
        return Response(res, 401, "You do not have Roles of this App");
      } else {
        next();
      }
    } else if (rolesList.title==="administrator") {
      next();
    }
  }
  // Check branch if required
  else {
    next();
  }
};
exports.appModelCheckPost =
  (appName, collectionName) => async (req, res, next) => {
    const user = req.user;
    let userPermissions = user.appPermissions ?? [];
    if (!userPermissions.includes(appName)) {
      return Response(res, 401, "You do not have Permission of this App");
    }
    // Check roles
    if (collectionName) {
      if (!user.roles || !user.roles.list) {
        return Response(res, 401, "You do not have Roles of this App ---");
      }
      const rolesList = user.roles?.list.map((item) => item);
      if (!rolesList.includes("manage-all")) {
        // const requiredRoles = [
        //   `${collectionName}-create`,
        //   `${collectionName}-delete`,
        //   `${collectionName}-post`,
        //   `${collectionName}-read`,
        // ];
        // if (!requiredRoles.some((role) => roles.includes(role))) {
        //   return Response(res, 401, "You do not have Roles of this App");
        // }
        if (!rolesList.includes(collectionName)) {
          return Response(res, 401, "You do not have Roles of this App");
        } else {
          next();
        }
      } else if (rolesList.includes("manage-all")) {
        next();
      }
    }
    // Check branch if required
    else {
      next();
    }
  };

// exports.branchCheckPost = async (req, res) => {
//   const branchCache = createCache("branchCache");
//   const branchId = user.branch._id;
//   if (!branchId || user.branch.status !== "active") {
//     return Response(res, 402, "Your branch is not Active");
//   }

//   if (branchCache.has(branchId)) {
//     return next();
//   }

//   try {
//     const response = await axios.get(
//       `${process.env.AUTHAPI}/branch/checkBranchExist/${branchId}`,
//       { token }
//     );

//     if (response.data) {
//       branchCache.set(branchId, response.data);
//       setTimeout(() => branchCache.delete(branchId), 600000);
//       return next();
//     } else {
//       return Response(res, 402, "Branch 500 Error");
//     }
//   } catch (error) {
//     return Response(res, 500, "Error checking branch status");
//   }
// };

// exports.caslAbility = handleAsync(async (req, res, next) => {
//   const user = req.user;
//   if (
//     user.permissions &&
//     user.permissions.length > 0 &&
//     user.roles &&
//     user.roles.length > 0
//   ) {
//     // Define abilities for the user
//     user.abilities = defineAbilitiesFor(user);
//   } else {
//     return Response(
//       res,
//       401,
//       "You do not have any permission and role assigned"
//     );
//   }
//   next();
// }, modelName);
// exports.checkPermissions = (action, resource) => (req, res, next) => {
//   const user = req.user;
//   if (!user.abilities.can(action, resource)) {
//     return Response(res, 403, "Forbidden");
//   }
//   next();
// };
