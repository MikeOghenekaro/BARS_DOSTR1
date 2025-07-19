const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const authenticate = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post(
  "/create",
  authenticate,
  authorize("superadmin"), // Only admins
  userController.createUser
);

router.get("/all", authenticate, authorize("admin", "superadmin"), userController.getUsers);
router.delete("/:id", authenticate, authorize("superadmin"), userController.deleteUser);


module.exports = router;
