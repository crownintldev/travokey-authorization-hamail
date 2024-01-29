//@ts-check

const express = require("express");
const router = express.Router();

const { create, update, remove, read, list } = require("../controllers/role");

router.post(
  "/role/create",
  create
);
router.put(
  "/role/update/:id",
  update
);
router.get(
  "/role",
  list
);
router.post(
  "/role/remove",
  remove
);

module.exports = router;
