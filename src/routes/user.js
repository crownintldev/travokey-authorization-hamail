const express = require("express");
const router = express.Router();

const {update} = require("../controllers/user")
const {requireSignin} = require("../middleware/auth-middleware")

router.put("/user/update",requireSignin,update)

module.exports = router;