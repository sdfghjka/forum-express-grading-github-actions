const express = require("express");
const router = express.Router();
const restController = require("../controllers/restaurant-controller");
const adminController = require("./modules/admin");

router.get("/restaurants", restController.getRestaurants);
router.use("/admin",adminController);
router.use("/", (req, res) => res.redirect("/restaurants"));

module.exports = router;
