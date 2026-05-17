const { dbConnection } = require("../db");

// db connections for user and vacation tables
const getUserRepo = () => dbConnection.getRepository("User");

// GET  /api/users
// returns all users
const getUsers = async (req, res, next) => {
	try {
		const users = await getUserRepo().find({
			order: { name: "ASC" },
		});
		res.json({ success: true, data: users });
	} catch (err) {
		next(err);
	}
};

// GET  /api/users/:id
// returns a single user by ID
const getUserById = async (req, res, next) => {
	try {
		const id = parseInt(req.params.id);
		const user = await getUserRepo().findOneBy({ id });

		if (!user) return res.status(404).json({ success: false, message: "User not found" });

		res.json({ success: true, data: user });
	} catch (err) {
		next(err);
	}
};

module.exports = { getUsers, getUserById };
