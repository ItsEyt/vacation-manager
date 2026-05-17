const { DataSource } = require("typeorm");
const { User } = require("./entities/User");
const { VacationRequest } = require("./entities/VacationRequest");

const dbConnection = new DataSource({
	type: "postgres",
	host: process.env.DB_HOST || "localhost",
	port: parseInt(process.env.DB_PORT) || 5432,
	database: process.env.DB_NAME || "vacation_db",
	username: process.env.DB_USER || "postgres",
	password: process.env.DB_PASSWORD || "password",
	synchronize: process.env.DB_SYNC === "true",
	logging: false,
	entities: [User, VacationRequest],
});

module.exports = { dbConnection };
