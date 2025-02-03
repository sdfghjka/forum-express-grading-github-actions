const express = require("express");
const router = express.Router();
const restController = require("../controllers/restaurant-controller");
const adminController = require("./modules/admin");
const userController = require("../controllers/user-controller");

router.get("/restaurants", restController.getRestaurants);
router.use("/admin", adminController);
router.get("/signup", userController.signUpPage);
router.post("/signup", userController.signUp);
router.use("/", (req, res) => res.redirect("/restaurants"));

module.exports = router;
