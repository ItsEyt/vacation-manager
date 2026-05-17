import { defineStore } from "pinia";
import { ref } from "vue";
import { createRequest, getRequestsByUser, getAllRequests, reviewRequest } from "/services";

export const useRequestsStore = defineStore("requests", () => {
	const myRequests = ref([]);
	const allRequests = ref([]);
	const loading = ref(false);
	const error = ref(null);

	function clearError() {
		error.value = null;
	}

	async function fetchMyRequests(userId) {
		loading.value = true;
		error.value = null;
		try {
			const { data } = await getRequestsByUser(userId);
			myRequests.value = data.data;
		} catch (e) {
			error.value = e.response?.data?.message || "Failed to load your requests";
		} finally {
			loading.value = false;
		}
	}

	async function submitRequest(payload) {
		loading.value = true;
		error.value = null;
		try {
			const { data } = await createRequest(payload);
			myRequests.value.unshift(data.data);
			return { success: true };
		} catch (e) {
			const msg = e.response?.data?.errors?.[0]?.message || e.response?.data?.message || "Failed to submit request";
			error.value = msg;
			return { success: false, message: msg };
		} finally {
			loading.value = false;
		}
	}

	async function fetchAllRequests(status = null) {
		loading.value = true;
		error.value = null;
		try {
			const { data } = await getAllRequests(status);
			allRequests.value = data.data;
		} catch (e) {
			error.value = e.response?.data?.message || "Failed to load requests";
		} finally {
			loading.value = false;
		}
	}

	async function review(id, payload) {
		error.value = null;
		try {
			const { data } = await reviewRequest(id, payload);
			const idx = allRequests.value.findIndex((r) => r.id === id);
			if (idx !== -1) allRequests.value[idx] = data.data;
			return { success: true };
		} catch (e) {
			const msg = e.response?.data?.errors?.[0]?.message || e.response?.data?.message || "Failed to review request";
			error.value = msg;
			return { success: false, message: msg };
		}
	}

	return {
		myRequests,
		allRequests,
		loading,
		error,
		clearError,
		fetchMyRequests,
		submitRequest,
		fetchAllRequests,
		review,
	};
});
