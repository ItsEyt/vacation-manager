const { Router } = require("express");
const { createRequest, getRequestsByUser, getAllRequests, reviewRequest } = require("../controllers/requestsController");
const { validateCreateRequest, validateReviewRequest, validateStatusFilter } = require("../middleware/validators");

const router = Router();

// POST     /api/requests
// submit new request
router.post("/", validateCreateRequest, createRequest);

// GET      /api/requests
// all requests (validator view, optional ?status= filter)
router.get("/", validateStatusFilter, getAllRequests);

// GET      /api/requests/user/:userId
// requests by a specific user
router.get("/user/:userId", getRequestsByUser);

// PATCH    /api/requests/:id/review
// approve or reject
router.patch("/:id/review", validateReviewRequest, reviewRequest);

module.exports = router;
