const { validationResult, body, param, query } = require("express-validator");

// runs validation results and returns 422 if any errors exist
const validate = (req, res, next) => {
	const errors = validationResult(req); // get all errors from current validation
	if (!errors.isEmpty()) {
		return res.status(422).json({
			success: false,
			message: "Validation failed",
			errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
		});
	}
	next();
};

// validation for vacation creation request
const validateCreateRequest = [
	body("user_id").notEmpty().withMessage("user_id is required").isInt({ min: 1 }).withMessage("user_id must be a positive integer"),
	body("start_date").notEmpty().withMessage("start_date is required").isDate().withMessage("start_date must be a valid date (YYYY-MM-DD)"),
	body("end_date").notEmpty().withMessage("end_date is required").isDate().withMessage("end_date must be a valid date (YYYY-MM-DD)")
		.custom((end_date, { req }) => { // check if end date is after start date
			if (new Date(end_date) < new Date(req.body.start_date)) {
				throw new Error("end_date must be on or after start_date");
			}
			return true;
		}),
	body("reason").optional().isString().isLength({ max: 500 }).withMessage("reason must be under 500 characters"),
	validate,
];

// validation for approving/rejecting a request
const validateReviewRequest = [
	param("id").isInt({ min: 1 }).withMessage("Request ID must be a positive integer"),
	body("status").notEmpty().withMessage("status is required").isIn(["Approved", "Rejected"]).withMessage("status must be 'Approved' or 'Rejected'"),
	body("comments") // check comments if status is Rejected
		.if(body("status").equals("Rejected"))
		.notEmpty()
		.withMessage("comments are required when rejecting a request")
		.isLength({ max: 1000 })
		.withMessage("comments must be under 1000 characters"),
	validate,
];

// validation for filtering requests by status
const validateStatusFilter = [
	query("status").optional().isIn(["Pending", "Approved", "Rejected"]).withMessage("status filter must be Pending, Approved, or Rejected"),
	validate,
];

module.exports = {
	validateCreateRequest,
	validateReviewRequest,
	validateStatusFilter,
};
