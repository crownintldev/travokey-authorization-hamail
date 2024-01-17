const express = require("express");
const router = express.Router();

const {auth,signup,signin,requireSignin,test,logoutalldevices} = require("../controllers/auth")

router.post("/auth/signup",signup)
router.post("/auth/signin",signin)
router.post("/test",requireSignin,test)
router.post("/auth/logoutall",requireSignin,logoutalldevices)

module.exports = router;