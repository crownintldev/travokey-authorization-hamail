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
router.put(
  "/user/editUserbyAdministrator",
  requireSignin,
  appCheckPost("administrator","user-update"),
  editUserbyAdministrator
);
router.get(
  "/user",
  requireSignin,
  appCheckPost("administrator", "user-list"),
  list
);

module.exports = router;
