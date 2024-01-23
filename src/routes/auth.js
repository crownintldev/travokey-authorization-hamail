const express = require("express");
const router = express.Router();

const {
  signup,
  signin,
  logout,
  test,
  logoutalldevices,
  me,
} = require("../controllers/auth");
const {
  requireSignin,
  caslAbility,
  sendParams,
  appCheckPost,
  checkPermissions,
} = require("../middleware/auth-middleware");

router.post("/auth/signup", signup);
router.post("/auth/signin", signin);
router.post("/auth/logout", requireSignin, logout);
router.post(
  "/test",
  requireSignin,
  appCheckPost("accountApp","testing"),
  test
);
router.get("/auth/me", requireSignin, me);
router.post("/auth/logoutall", requireSignin, logoutalldevices);

module.exports = router;
