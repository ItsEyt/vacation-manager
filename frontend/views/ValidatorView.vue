<template>
	<div class="dashboard-wrapper">
		<!-- Page header -->
		<div class="page-header">
			<div>
				<h1 class="page-title">Requests Dashboard</h1>
				<p class="page-sub">Review and manage all vacation requests.</p>
			</div>
			<div class="header-stats">
				<div :class="['badge', `badge-${s.key.toLowerCase()}`]" v-for="s in statuses" :key="s.label">
					<span>{{ s.label }}&nbsp;</span>
					<strong>{{ countByStatus(s.key) }}</strong>
				</div>
			</div>
		</div>

		<!-- Filters -->
		<div class="filter-bar">
			<span class="filter-label">Filter by status</span>
			<div class="filter-tabs">
				<button
					v-for="f in filters"
					:key="f.value"
					:class="['filter-tab', { active: activeFilter === f.value }]"
					@click="applyFilter(f.value)">
					{{ f.label }}
				</button>
			</div>
		</div>

		<!-- Alert -->
		<div v-if="store.error" class="alert alert-error">{{ store.error }}</div>
		<div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

		<!-- Table -->
		<div v-if="store.loading" class="loading-state">Loading requests…</div>

		<div v-else-if="!store.allRequests.length" class="empty-state">
			<div class="empty-icon">📭</div>
			<p>No requests found{{ activeFilter ? ` with status "${activeFilter}"` : "" }}.</p>
		</div>

		<div v-else class="requests-table">
			<div class="table-header">
				<span></span>
				<span>{{ isMobile ? "Emp." : "Employee" }}</span>
				<span>Dates</span>
				<span>{{ isMobile ? "Dur." : "Duration" }}</span>
				<span>Reason</span>
				<span>Submitted</span>
				<span>Actions</span>
			</div>
			<div class="table-body">
				<div class="table-row" v-for="req in store.allRequests" :key="req.id">
					<span :class="['badge', `badge-${req.status.toLowerCase()}`]" :title="req.status"></span>
					<span class="employee-name">{{ req.user.name }}</span>
					<span class="dates-text">
						<span>{{ formatDate(req.start_date) }}</span> → <span>{{ formatDate(req.end_date) }}</span>
					</span>
					<span class="center-cell">{{ calcDays(req.start_date, req.end_date) }} days</span>
					<span class="reason-text" :title="req.reason">{{ req.reason || "-" }}</span>
					<span class="muted">{{ formatDate(req.created_at) }}</span>
					<span class="action-cell">
						<span v-if="req.status === 'Pending'" class="action-cell">
							<button class="button-primary" @click="openReview(req, 'Approved')">{{ "✓" + (isMobile ? "" : "Approve") }}</button>
							<button class="button-danger" @click="openReview(req, 'Rejected')">{{ "✕" + (isMobile ? "" : "Reject") }}</button>
						</span>
						<span v-else class="reviewed-cell">
							<span class="muted" style="font-size: 12px">Reviewed </span>
							<span v-if="req.comments" class="comment-preview" :title="req.comments">
								{{ req.comments.substring(0, 40) }}{{ req.comments.length > 40 ? "…" : "" }}
							</span>
						</span>
					</span>
				</div>
			</div>
		</div>

		<!-- Reject/Approve modal -->
		<Teleport to="body">
			<div v-if="modal.open" class="modal-overlay" @click.self="closeModal">
				<div class="modal-box">
					<h3 class="modal-title">
						{{ modal.action === "Approved" ? "✓ Approve Request" : "✕ Reject Request" }}
					</h3>
					<p class="modal-sub">
						<strong>{{ modal.request?.user?.name }}</strong> - {{ formatDate(modal.request?.start_date) }}
						to
						{{ formatDate(modal.request?.end_date) }}
					</p>

					<div v-if="modal.action === 'Rejected'" class="form-group">
						<label class="form-label">Reason for Rejection *</label>
						<textarea
							v-model="modal.comments"
							class="form-control"
							:class="{ 'input-error': modal.commentError }"
							placeholder="Explain why this request is being rejected…"
							rows="3" />
						<span v-if="modal.commentError" class="field-error">{{ modal.commentError }}</span>
					</div>

					<div v-else>
						<div class="form-group">
							<label class="form-label">Optional Comment</label>
							<textarea v-model="modal.comments" class="form-control" placeholder="Add an optional note for the employee…" rows="2" />
						</div>
					</div>

					<div class="modal-footer">
						<button class="button button-ghost" @click="closeModal">Cancel</button>
						<button
							:class="['button', modal.action === 'Approved' ? 'button-primary' : 'button-danger']"
							@click="confirmReview"
							:disabled="reviewing">
							{{
								reviewing ? "Processing…"
								: modal.action === "Approved" ? "Confirm Approval"
								: "Confirm Rejection"
							}}
						</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRequestsStore } from "@/stores/requests";

const store = useRequestsStore();
const activeFilter = ref(null);
const successMsg = ref("");
const reviewing = ref(false);

const isMobile = ref(false);

function checkScreen() {
	isMobile.value = window.innerWidth < 1024;
}

const statuses = [
	{ key: "Pending", label: "Pending" },
	{ key: "Approved", label: "Approved" },
	{ key: "Rejected", label: "Rejected" },
];

const filters = [
	{ label: "All", value: null },
	{ label: "Pending", value: "Pending" },
	{ label: "Approved", value: "Approved" },
	{ label: "Rejected", value: "Rejected" },
];

const modal = ref({ open: false, action: null, request: null, comments: "", commentError: "" });

onMounted(() => {
	checkScreen();
	window.addEventListener("resize", checkScreen);
	store.fetchAllRequests();
});

onUnmounted(() => {
	window.removeEventListener("resize", checkScreen);
});

async function applyFilter(status) {
	activeFilter.value = status;
	await store.fetchAllRequests(status);
}

function countByStatus(status) {
	return store.allRequests.filter((r) => r.status === status).length;
}

function openReview(req, action) {
	store.clearError();
	modal.value = { open: true, action, request: req, comments: "", commentError: "" };
}

function closeModal() {
	modal.value.open = false;
}

async function confirmReview() {
	store.clearError();
	modal.value.commentError = "";

	if (modal.value.action === "Rejected" && !modal.value.comments.trim()) {
		modal.value.commentError = "A reason is required when rejecting a request.";
		return;
	}

	reviewing.value = true;
	const result = await store.review(modal.value.request.id, {
		status: modal.value.action,
		comments: modal.value.comments || undefined,
	});
	reviewing.value = false;

	if (result.success) {
		successMsg.value = `✅ Request ${modal.value.action.toLowerCase()} successfully.`;
		closeModal();
		setTimeout(() => (successMsg.value = ""), 4000);
	}
}

function formatDate(d) {
	if (!d) return "-";
	return new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function calcDays(s, e) {
	return Math.round((new Date(e) - new Date(s)) / 86400000) + 1;
}
</script>

<style scoped>
.dashboard-wrapper {
	background-color: #fff;
	padding: 20px;
	border-radius: 8px;
	width: 90%;
	margin: 10px auto;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.page-sub {
	color: var(--text-color);
	font-size: 0.9em;
	margin-top: 4px;
}

.header-stats {
	display: flex;
	gap: 25px;
	margin-top: 10px;
}

.requests-table {
	width: 100%;
	border-collapse: collapse;
    max-height: 60dvh;
    overflow: auto scroll;

	&& td {
		text-align: center;
		vertical-align: middle;
	}
}

.table-row,
.table-header {
	display: grid;
	grid-template-columns: 0.1fr 0.3fr 1fr 0.3fr 1.5fr 0.5fr 1.5fr;
	width: 100%;
	text-align: center;
	padding: 5px 0;
	min-height: 30px;
}

.table-header {
	font-weight: bold;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 1;
}

.table-row {
	border-top: 1px solid var(--text-color);
}

.dates-cell {
	display: flex;
	justify-content: center;
	align-items: center;
}

.action-cell {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;

	&& .button {
		padding: 4px 8px;
		font-size: 0.85em;
	}
}

.comment-preview {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.filter-bar {
	display: flex;
	align-items: center;
	gap: 20px;
	padding: 10px 20px;
}

.filter-tabs {
	display: flex;
	gap: 10px;

	&& .filter-tab {
		padding: 6px 12px;
		border: none;
		border-radius: 5px;
		background-color: var(--text-color);
		color: var(--white);
		cursor: pointer;

		&.active {
			background-color: var(--primary-color);
		}
	}
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
}

.modal-box {
	background-color: #fff;
	padding: 20px;
	border-radius: 8px;
	width: 400px;
}

.form-group {
	display: flex;
	flex-direction: column;
	margin-top: 16px;

	&& input,
	&& textarea {
		padding: 8px;
		border: 1px solid var(--nav-background);
		border-radius: 5px;
	}
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 20px;
}

button {
	padding: 8px 16px;
	border: none;
	border-radius: 5px;
	cursor: pointer;

	&.button-primary {
		background-color: var(--primary-color);
		color: var(--white);
	}

	&.button-danger {
		background-color: var(--danger-color);
		color: var(--white);
	}

	&.button-ghost {
		background-color: transparent;
		color: var(--text-color);
	}
}

@media only screen and (max-width: 1024px) {
	.dates-text {
		display: flex;
		flex-direction: column;
	}

	.table-row,
	.table-header {
		grid-template-columns: 0.1fr 0.3fr 1fr 0.3fr 1fr 0.5fr 1fr;
	}

	.table-row {
		height: auto;
	}
}
</style>
