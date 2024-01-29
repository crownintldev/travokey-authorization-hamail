//@ts-check

const express = require("express");
const router = express.Router();

const { create, update, remove, read, list } = require("../controllers/role");
const {
  requireSignin,
  appCheckPost,
} = require("../middleware/auth-middleware");

router.post(
  "/role/create",
  requireSignin,
  appCheckPost("administrator", ""),
  create
);
router.put(
  "/role/update/:id",
  requireSignin,
  appCheckPost("administrator", ""),
  update
);
router.get(
  "/role",
  requireSignin,
  appCheckPost("administrator", ""),
  list
);
router.post(
  "/role/remove",
  requireSignin,
  appCheckPost("administrator", ""),
  remove
);

module.exports = router;
