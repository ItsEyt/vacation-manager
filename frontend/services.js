import axios from "axios";

const api = axios.create({
	baseURL: "/api",
	headers: { "Content-Type": "application/json" },
});

export const getUsers = () => api.get("/users");

// submit a new vacation request
export const createRequest = (payload) => api.post("/requests", payload);

// get all requests for a specific user
export const getRequestsByUser = (userId) => api.get(`/requests/user/${userId}`);

// get all requests, optionally filtered by status
export const getAllRequests = (status = null) => api.get("/requests", { params: status ? { status } : {} });

// approve or reject a request
export const reviewRequest = (id, payload) => api.patch(`/requests/${id}/review`, payload);

export default api;
