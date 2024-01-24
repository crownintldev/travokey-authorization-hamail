const express = require("express");
const router = express.Router();

const { update, list,editUserbyAdministrator } = require("../controllers/user");
const {
  requireSignin,
  appCheckPost,
} = require("../middleware/auth-middleware");

router.put(
  "/user/update",
  requireSignin,
  // appCheckPost("account","user"),
  update
);
// router.put(
//   "/user/editUserbyAdministrator",
//   requireSignin,
//   appCheckPost(["account"],"user"),
//   editUserbyAdministrator
// );
router.get(
  "/user/list",
  requireSignin,
  appCheckPost(["account"], "user"),
  list
);

module.exports = router;
