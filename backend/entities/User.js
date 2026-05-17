const { EntitySchema } = require("typeorm");

const User = new EntitySchema({
	name: "User",
	tableName: "users",
	columns: {
		id: {
			type: "int",
			primary: true,
			generated: true,
		},
		name: {
			type: "varchar",
			length: 100,
			nullable: false,
		},
		role: {
			type: "enum",
			enum: ["Requester", "Validator"],
			default: "Requester",
		},
	},
	relations: {
		vacationRequests: {
			type: "one-to-many",
			target: "VacationRequest",
			inverseSide: "user",
		},
	},
});

module.exports = { User };
