const express = require("express");
const router = express.Router();

const {
  signup,
  signin,
  getUserFromToken,
  logout,
  test,
  logoutalldevices,
  me,
} = require("../controllers/auth");
const {
  requireSignin,
  appCheckPost,
} = require("../middleware/auth-middleware");

router.post("/auth/signup", signup);
router.post("/auth/signin", signin);
router.post("/auth/getUserFromToken",getUserFromToken);
router.post("/auth/logout", requireSignin, logout);
router.post("/auth/logoutall", requireSignin, logoutalldevices);
router.post(
  "/auth/test",
  requireSignin,
  appCheckPost("account", "testing-create"),
  test
);
router.get("/auth/me", requireSignin, me);

module.exports = router;
