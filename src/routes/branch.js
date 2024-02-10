//@ts-check
const express = require("express");
const router = express.Router();

const {create,update,remove,read,list,checkBranchExist} = require("../controllers/branch")
const {requireSignin,appCheckPost} = require("../middleware/auth-middleware")

let model = "branch";

router.use("/branch", requireSignin, appCheckPost("administrator"));
router.post(`/${model}/create`,create)
router.put(`/${model}/update/:id`,update)
router.get(`/${model}/checkBranchExist/:id`,checkBranchExist)
router.get(`/${model}/:query?`,list)
router.post(`/${model}/remove`,remove)

module.exports = router;