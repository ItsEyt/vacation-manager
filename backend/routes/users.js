const { Router } = require("express");
const { getUsers, getUserById } = require("../controllers/usersController");

const router = Router();

// GET  /api/users
// list all users
router.get("/", getUsers);

// GET  /api/users/:id
// get one user
router.get("/:id", getUserById);

module.exports = router;
