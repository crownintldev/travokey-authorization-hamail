//@ts-check

const express = require("express");
const router = express.Router();
const {
  requireSignin,
  appCheckPost,
} = require("../middleware/auth-middleware");
const { create, update, remove, read, list } = require("../controllers/role");

router.use("/role", requireSignin, appCheckPost("administrator"));
router.post("/role/create", create);
router.put("/role/update/:id", update);
router.get("/role/:query?", list);
router.post("/role/remove", remove);

module.exports = router;
