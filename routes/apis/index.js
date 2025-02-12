const express = require("express");
const router = express.Router();
const admin = require('../apis/modules/admin')
const restController = require("../../controllers/apis/restaurant-controller");
const { apiErrorHandler} = require('../../middleware/error-handler')

router.get("/restaurants", restController.getRestaurants);
router.use("/admin",admin);


router.use('/', apiErrorHandler) 





module.exports = router;
