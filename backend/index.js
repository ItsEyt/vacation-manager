require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { dbConnection } = require("./db");
const { errorHandler, notFound } = require("./middleware/errors");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" })); // allow connection from the frontend
app.use(express.json()); // wrapper for parsing API calls to json

// ROUTES
app.use("/api/requests", require("./routes/requests"));
app.use("/api/users", require("./routes/users"));

app.use("/health", (req, res) => res.json({ status: "ok" }));

// ERRORS
app.use(notFound);
app.use(errorHandler);

// INIT
const PORT = process.env.PORT || 3000;

async function start() {
	try {
		await dbConnection.initialize();
		console.log("database connected");
		if (process.env.NODE_ENV !== "test") {
			app.listen(PORT, () => {
				console.log(`server listening on http://localhost:${PORT}`);
			});
		}
	} catch (err) {
		console.error("failed to start server: ", err);
		if (process.env.NODE_ENV !== "test") {
			process.exit(1);
		}
	}
}
start();

module.exports = app; // exported for tests
