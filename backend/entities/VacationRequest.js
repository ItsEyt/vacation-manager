const { EntitySchema } = require("typeorm");

const VacationRequest = new EntitySchema({
	name: "VacationRequest",
	tableName: "vacation_requests",
	columns: {
		id: {
			type: "int",
			primary: true,
			generated: true,
		},
		start_date: {
			type: "date",
			nullable: false,
		},
		end_date: {
			type: "date",
			nullable: false,
		},
		reason: {
			type: "text",
			nullable: true,
		},
		status: {
			type: "enum",
			enum: ["Pending", "Approved", "Rejected"],
			default: "Pending",
		},
		comments: {
			type: "text",
			nullable: true,
		},
		created_at: {
			type: "timestamp",
			createDate: true,
		},
	},
	relations: {
		user: {
			type: "many-to-one",
			target: "User",
			joinColumn: { name: "user_id" },
			nullable: false,
		},
	},
});

module.exports = { VacationRequest };
