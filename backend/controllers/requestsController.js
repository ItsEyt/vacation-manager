const { dbConnection } = require("../db");

// db connections for user and vacation tables
const getUserRepo = () => dbConnection.getRepository("User");
const getVacationRepo = () => dbConnection.getRepository("VacationRequest");

// POST  /api/requests
// submit a new vacation request
const createRequest = async (req, res, next) => {
	try {
		const { user_id, start_date, end_date, reason } = req.body;

		const userRepo = getUserRepo();
		const user = await userRepo.findOneBy({ id: user_id });

		if (!user) return res.status(404).json({ success: false, message: "User not found" });

		if (user.role !== "Requester") return res.status(403).json({ success: false, message: "Only Requesters can submit vacation requests" });

		const request = getVacationRepo().create({
			user: { id: user_id },
			start_date,
			end_date,
			reason: reason || null,
			status: "Pending",
		});

		const saved = await getVacationRepo().save(request);
		saved.user = user; // include user data in response

		res.status(201).json({ success: true, data: saved });
	} catch (err) {
		next(err);
	}
};

// GET  /api/requests/user/:userId
// get all requests submitted by a specific user
const getRequestsByUser = async (req, res, next) => {
	try {
		const userId = parseInt(req.params.userId);

		const userRepo = getUserRepo();
		const user = await userRepo.findOneBy({ id: userId });

		if (!user) return res.status(404).json({ success: false, message: "User not found" });

		const requests = await getVacationRepo().find({
			where: { user: { id: userId } },
			relations: ["user"],
			order: { created_at: "DESC" },
		});

		res.json({ success: true, data: requests });
	} catch (err) {
		next(err);
	}
};

// GET  /api/requests
// get all vacation requests | optional status filter
const getAllRequests = async (req, res, next) => {
	try {
		const { status } = req.query;

		const where = status ? { status } : {}; // only filter if requested in the query
		const requests = await getVacationRepo().find({
			where,
			relations: ["user"],
			order: { created_at: "DESC" },
		});

		res.json({ success: true, data: requests });
	} catch (err) {
		next(err);
	}
};

// PATCH /api/requests/:id/review
// approve or reject a vacation request
const reviewRequest = async (req, res, next) => {
	try {
		const id = parseInt(req.params.id);
		const { status, comments } = req.body;

		const request = await getVacationRepo().findOne({
			where: { id },
			relations: ["user"],
		});

		if (!request) return res.status(404).json({ success: false, message: "Vacation request not found" });

		if (request.status !== "Pending") {
			return res.status(409).json({
				success: false,
				message: `Request has already been ${request.status.toLowerCase()}`, // Rejected | Approved
			});
		}

		request.status = status;
		request.comments = comments || null;
		const updated = await getVacationRepo().save(request);

		res.json({ success: true, data: updated });
	} catch (err) {
		next(err);
	}
};

module.exports = { createRequest, getRequestsByUser, getAllRequests, reviewRequest };
