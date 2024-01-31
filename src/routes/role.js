//@ts-check

const express = require("express");
const router = express.Router();
const {
  requireSignin,
} = require("../middleware/auth-middleware");
const { create, update, remove, read, list } = require("../controllers/role");

router.post(
  "/role/create",
  requireSignin,
  create
);
router.put(
  "/role/update/:id",
  requireSignin,
  update
);
router.get(
  "/role",
  requireSignin,
  list
);
router.post(
  "/role/remove",
  requireSignin,
  remove
);

module.exports = router;
