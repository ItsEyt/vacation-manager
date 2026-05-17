require("dotenv").config();
const { dbConnection } = require("./db");

/**
 * populate the database with sample users (2 requesters, 1 validator)
 * Run with: node src/seed.js
 */
async function seed() {
	await dbConnection.initialize();
	console.log("database connected");

	const userRepo = dbConnection.getRepository("User");

	// Avoid re-populating (duplicates)
	const existing = await userRepo.count();
	if (existing > 0) {
		console.log("Users already exist, skipping seed.");
		await dbConnection.destroy();
		return;
	}

	const users = userRepo.create([
		{ name: "Alice", role: "Requester" },
		{ name: "Bob", role: "Requester" },
		{ name: "Carol", role: "Validator" },
	]);

	await userRepo.save(users);
	console.log("added 3 users: Alice (Requester), Bob (Requester), Carol (Validator)");
	await dbConnection.destroy();
}

seed().catch((err) => {
	console.error("seed failed:", err);
	process.exit(1);
});
