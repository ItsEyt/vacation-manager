<template>
	<div class="requester-layout">
		<section class="form-section">
			<div class="card">
				<h2>Request Time Off</h2>
				<p>Fill in the details below to submit a new vacation request</p>

				<div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
				<div v-if="store.error" class="alert alert-error">{{ store.error }}</div>

				<form @submit.prevent="handleSubmit" novalidate>
					<div class="form-row">
						<div class="form-group">
							<label class="form-label">Start Date *</label>
							<input v-model="form.start_date" type="date" :class="{ 'input-error': errors.start_date }" :min="today" />
							<span class="field-error">{{ errors.start_date }}</span>
						</div>
						<div class="form-group">
							<label class="form-label">End Date *</label>
							<input v-model="form.end_date" type="date" :class="{ 'input-error': errors.end_date }" :min="form.start_date || today" />
							<span class="field-error">{{ errors.end_date }}</span>
						</div>
					</div>

					<div class="form-group">
						<label class="form-label">Reason <span class="optional">(optional)</span></label>
						<textarea v-model="form.reason" placeholder="Briefly describe the reason for your leave…" rows="3" />
					</div>

					<div class="form-footer">
						<span v-if="duration > 0" class="hint">{{ duration }} day{{ duration !== 1 ? "s" : "" }} off </span>
						<button type="submit" class="submit-button" :disabled="store.loading || !userStore.currentUser">
							<span v-if="store.loading">Submitting…</span>
							<span v-else>Submit Request</span>
						</button>
					</div>

					<p v-if="!userStore.currentUser" class="hint">Select a user above to submit a request.</p>
					<p v-else-if="userStore.isValidator" class="hint warn">
						Validators cannot submit vacation requests. Switch to a Requester account.
					</p>
				</form>
			</div>
		</section>

		<section v-if="!userStore.isValidator">
			<div class="list-header">
				<h2>My Requests</h2>
				<span>{{ store.myRequests.length }}</span>
			</div>

			<div v-if="store.loading && !store.myRequests.length">Loading…</div>

			<div v-else-if="!store.myRequests.length">
				<p>No requests yet. Submit your first one!</p>
			</div>

			<div v-else>
				<div v-for="req in store.myRequests" :key="req.id" class="request-item">
					<span :class="['badge', `badge-${req.status.toLowerCase()}`]" :title="req.status"></span>
					<div>
						<span class="request-dates"> {{ formatDate(req.start_date) }} → {{ formatDate(req.end_date) }} </span>
						<span class="request-days">({{ calcDays(req.start_date, req.end_date) }} days)</span>
					</div>
					<p class="request-reason">{{ req.reason }}</p>
					<div class="request-comments"><strong v-if="req.comments">Manager comment:</strong> {{ req.comments }}</div>
					<div class="request-date">Submitted {{ formatDateTime(req.created_at) }}</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRequestsStore } from "@/stores/requests";
import { useUserStore } from "@/stores/user";

const store = useRequestsStore();
const userStore = useUserStore();

const today = new Date().toISOString().split("T")[0];

const form = ref({ start_date: "", end_date: "", reason: "" });
const errors = ref({});
const successMsg = ref("");

// calculates the duration of the vacation in days
const duration = computed(() => {
	if (!form.value.start_date || !form.value.end_date) return 0;
	const d = (new Date(form.value.end_date) - new Date(form.value.start_date)) / 86400000 + 1;
	return d > 0 ? d : 0;
});

function validate() {
	const errorObj = {};
	if (!form.value.start_date) errorObj.start_date = "Start date is required";
	if (!form.value.end_date) errorObj.end_date = "End date is required";
	else if (form.value.start_date && new Date(form.value.end_date) < new Date(form.value.start_date))
		errorObj.end_date = "End date must be after start date";
	errors.value = errorObj;
	return Object.keys(errorObj).length === 0; // if any error, return false
}

async function handleSubmit() {
	store.clearError();
	successMsg.value = "";
	if (!validate()) return;
	if (!userStore.currentUser || userStore.isValidator) return;

	const result = await store.submitRequest({
		user_id: userStore.currentUser.id,
		start_date: form.value.start_date,
		end_date: form.value.end_date,
		reason: form.value.reason || undefined,
	});

	if (result.success) {
		successMsg.value = "Your request has been submitted!";
		form.value = { start_date: "", end_date: "", reason: "" };
		errors.value = {};
		setTimeout(() => (successMsg.value = ""), 4000);
	}
}

// Reload requests when user changes
watch(
	() => userStore.currentUserId,
	(id) => {
		if (id) store.fetchMyRequests(id);
	},
	{ immediate: true },
);

function formatDate(d) {
	return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d) {
	return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function calcDays(s, e) {
	return Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
}
</script>

<style scoped>
* {
	text-align: center;
}

.hint {
	font-size: 0.9em;
	color: #666;
}

.warn {
	color: var(--danger-color);
}

.requester-layout {
	display: flex;
	flex-direction: column;
	gap: 20px;
	flex-grow: 1;
	justify-content: center;
	align-items: center;
	padding: 20px;
}

section {
	background: #fff;
	width: 90%;
	padding: 10px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	max-height: 48dvh;
	overflow: auto scroll;
	padding-top: 0;
}

form {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.form-row {
	display: flex;
	gap: 20px;
	margin: 0 auto;
}

.form-group {
	display: flex;
	flex-direction: column;
	flex: 1;
	justify-content: center;
	align-items: center;

	&& input {
		width: 80%;
		padding: 5px;
		border: 1px solid var(--nav-background);
		border-radius: 10px;
	}

	&& textarea {
		width: 50%;
		height: 80px;
	}
}

.form-label {
	margin-bottom: 0;

	&& .optional {
		font-weight: normal;
		font-size: 0.8em;
		color: #666;
	}
}

.field-error {
	height: 1rem;
	color: var(--danger-color);
	font-size: 0.8em;
	margin-top: 4px;
}

.form-footer {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column-reverse;
	gap: 20px;
	margin-top: 10px;
}

.submit-button {
	padding: 10px 20px;
	border: none;
	border-radius: 5px;
	background: var(--primary-color);
	color: #fff;
	cursor: pointer;
	transition: background 0.2s ease;

	&:disabled {
		background: #95a5a6;
		cursor: not-allowed;
	}
}

.list-header {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;
	position: sticky;
	top: 0;
	background: #fff;
	z-index: 1;
    border-bottom: 1px solid var(--text-color);

	&& h2 {
		margin: 5px;
	}
}

.request-item {
	display: grid;
	place-items: center;
	grid-template-columns: 0.1fr 1fr 1fr 1fr 1fr;
	gap: 10px;
	padding: 10px;
	border-top: 1px solid #ccc;
}
</style>
