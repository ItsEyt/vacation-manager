/**
 * integration tests for the Vacation Requests API
 *
 * run: npm test
 */

process.env.NODE_ENV = "test";
process.env.DB_NAME = "vacation_test"; // separate test database
process.env.DB_SYNC = "true"

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { dbConnection } = require("../db");
const { DataSource } = require("typeorm");
const request = require("supertest");
const { User } = require("../entities/User");
const { VacationRequest } = require("../entities/VacationRequest");

const app = require("../index");

//* ============ Helpers ============
let requester, validator;

// initialize db and add 2 users (requester + validator)
beforeAll(async () => {
	await dbConnection.initialize();

	const userRepo = dbConnection.getRepository("User");
	requester = await userRepo.save({ name: "Test Requester", role: "Requester" });
	validator = await userRepo.save({ name: "Test Validator", role: "Validator" });
});

// clean up db after testing
afterAll(async () => {
	if (dbConnection.isInitialized) await dbConnection.destroy();
});

// clean between tests
afterEach(async () => {
	// Clean requests between tests
	await dbConnection.getRepository("VacationRequest").clear();
});

//* ============ Tests ============
describe("POST /api/requests", () => {
	it("creates a vacation request successfully", async () => {
		const res = await request(app).post("/api/requests").send({
			user_id: requester.id,
			start_date: "2026-08-01",
			end_date: "2026-08-05",
			reason: "Summer holiday",
		});

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.data.status).toBe("Pending");
		expect(res.body.data.user.id).toBe(requester.id);
	});

	it("returns 422 when start_date is missing", async () => {
		const res = await request(app).post("/api/requests").send({
			user_id: requester.id,
			end_date: "2026-08-05",
		});

		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.errors.some((e) => e.field === "start_date")).toBe(true);
	});

	it("returns 422 when end_date is before start_date", async () => {
		const res = await request(app).post("/api/requests").send({
			user_id: requester.id,
			start_date: "2026-08-10",
			end_date: "2026-08-01",
		});

		expect(res.status).toBe(422);
		expect(res.body.errors.some((e) => e.field === "end_date")).toBe(true);
	});

	it("returns 403 when a Validator tries to submit a request", async () => {
		const res = await request(app).post("/api/requests").send({
			user_id: validator.id,
			start_date: "2026-08-01",
			end_date: "2026-08-05",
		});

		expect(res.status).toBe(403);
	});

	it("returns 404 for a non-existent user_id", async () => {
		const res = await request(app).post("/api/requests").send({
			user_id: 9999,
			start_date: "2026-08-01",
			end_date: "2026-08-05",
		});

		expect(res.status).toBe(404);
	});
});

describe("GET /api/requests/user/:userId", () => {
	it("returns requests for a specific user", async () => {
		// Create one request
		await request(app).post("/api/requests").send({
			user_id: requester.id,
			start_date: "2026-08-01",
			end_date: "2026-08-03",
		});

		const res = await request(app).get(`/api/requests/user/${requester.id}`);

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveLength(1);
	});

	it("returns 404 for unknown user", async () => {
		const res = await request(app).get("/api/requests/user/9999");

		expect(res.status).toBe(404);
	});
});

describe("GET /api/requests", () => {
	beforeEach(async () => {
		// create two requests
		const r1 = await request(app).post("/api/requests").send({
			user_id: requester.id,
			start_date: "2026-08-01",
			end_date: "2026-08-03",
		});
		// approve the first one
		await request(app).patch(`/api/requests/${r1.body.data.id}/review`).send({ status: "Approved" });

		await request(app).post("/api/requests").send({
			user_id: requester.id,
			start_date: "2026-09-01",
			end_date: "2026-09-05",
		});
	});

	it("returns all requests", async () => {
		const res = await request(app).get("/api/requests");

		expect(res.status).toBe(200);
		expect(res.body.data.length).toBeGreaterThanOrEqual(2);
	});

	it("filters by status = Pending", async () => {
		const res = await request(app).get("/api/requests?status=Pending");

		expect(res.status).toBe(200);
		res.body.data.forEach((r) => expect(r.status).toBe("Pending"));
	});

	it("filters by status = Approved", async () => {
		const res = await request(app).get("/api/requests?status=Approved");

		expect(res.status).toBe(200);
		res.body.data.forEach((r) => expect(r.status).toBe("Approved"));
	});

	it("returns 422 for invalid status filter", async () => {
		const res = await request(app).get("/api/requests?status=Invalid");

		expect(res.status).toBe(422);
	});
});

describe("PATCH /api/requests/:id/review", () => {
	let requestId;

	// create a new request
	beforeEach(async () => {
		const res = await request(app).post("/api/requests").send({
			user_id: requester.id,
			start_date: "2026-08-01",
			end_date: "2026-08-05",
		});
		requestId = res.body.data.id;
	});

	it("approves a pending request", async () => {
		const res = await request(app).patch(`/api/requests/${requestId}/review`).send({ status: "Approved" });

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("Approved");
	});

	it("rejects a request with a comment", async () => {
		const res = await request(app).patch(`/api/requests/${requestId}/review`).send({ status: "Rejected", comments: "Too many people on leave" });

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("Rejected");
		expect(res.body.data.comments).toBe("Too many people on leave");
	});

	it("requires comments when rejecting", async () => {
		const res = await request(app).patch(`/api/requests/${requestId}/review`).send({ status: "Rejected" }); // no comments

		expect(res.status).toBe(422);
		expect(res.body.errors.some((e) => e.field === "comments")).toBe(true);
	});

	it("returns 409 when reviewing an already-reviewed request", async () => {
		await request(app).patch(`/api/requests/${requestId}/review`).send({ status: "Approved" });
		const res = await request(app).patch(`/api/requests/${requestId}/review`).send({ status: "Rejected", comments: "Changed my mind" });

		expect(res.status).toBe(409);
	});

	it("returns 404 for unknown request id", async () => {
		const res = await request(app).patch("/api/requests/9999/review").send({ status: "Approved" });

		expect(res.status).toBe(404);
	});
});
