//@ts-check
const express = require("express");
const router = express.Router();

const { update, list,editUserbyAdministrator } = require("../controllers/user");
const {
  requireSignin,
  appModelCheckPost,
} = require("../middleware/auth-middleware");

router.put(
  "/user/update",
  // appCheckPost("account","user"),
  update
);
router.put(
  "/user/editUserbyAdministrator",
  requireSignin,
  appModelCheckPost("administrator"),
  editUserbyAdministrator
);
router.get(
  "/user/:query?",
  requireSignin,
  appModelCheckPost("administrator"),
  list
);

module.exports = router;
