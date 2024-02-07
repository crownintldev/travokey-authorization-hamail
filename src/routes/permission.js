//@ts-check
const express = require("express");
const router = express.Router();

const {
    requireSignin,
    appCheckPost,
  } = require("../middleware/auth-middleware");

const {create,update,remove,read,list} = require("../controllers/permission")

router.use("/role", requireSignin, appCheckPost("administrator"));
router.post("/permission/create",create)
router.put("/permission/update/:id",update)
router.get("/permission",list)
router.post("/permission/remove",remove)

module.exports = router;