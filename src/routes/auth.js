const express = require("express");
const router = express.Router();

const {signup,signin,logout,test,logoutalldevices} = require("../controllers/auth")
const {requireSignin} = require("../middleware/auth-middleware")

router.post("/auth/signup",signup)
router.post("/auth/signin",signin)
router.post("/auth/logout",requireSignin,logout)
router.post("/test",requireSignin,test)
router.post("/auth/logoutall",requireSignin,logoutalldevices)

module.exports = router;