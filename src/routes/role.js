//@ts-check

const express = require("express");
const router = express.Router();

const {create,update,remove,read,list} = require("../controllers/role")
const {requireSignin} = require("../middleware/auth-middleware")

router.post("/role/create",create)
router.put("/role/update/:id",update)
router.get("/role",requireSignin,list)
router.delete("/role/remove",requireSignin,remove)

module.exports = router;