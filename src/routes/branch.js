//@ts-check
const express = require("express");
const router = express.Router();

const {create,update,remove,read,list} = require("../controllers/branch")
const {requireSignin} = require("../middleware/auth-middleware")

let model = "branch";

router.post(`/${model}/create`,create)
router.put(`/${model}/update/:id`,update)
router.get(`/${model}`,list)
router.post(`/${model}/remove`,remove)

module.exports = router;