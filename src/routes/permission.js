//@ts-check
const express = require("express");
const router = express.Router();

const {create,update,remove,read,list} = require("../controllers/permission")
const {requireSignin} = require("../middleware/auth-middleware")

router.post("/permission/create",create)
router.put("/permission/update/:id",update)
router.get("/permission",list)
router.post("/permission/remove",remove)

module.exports = router;