<template>
	<div id="app-shell">
		<header class="navbar">
			<div class="brand">
				<span class="brand-icon">✦</span>
				<span class="brand-name">VacationManager</span>
			</div>

			<!-- User picker (simulates session) -->
			<div class="user-picker" v-if="userStore.users.length">
				<label class="user-label">Logged in as</label>
				<select v-model="selectedUserId" @change="onUserChange" class="user-select">
					<option v-for="u in userStore.users" :key="u.id" :value="u.id">{{ u.name }} ({{ u.role }})</option>
				</select>
			</div>

			<nav class="nav-links">
				<RouterLink v-if="userStore.isRequester" class="nav-link" :class="{ 'nav-link-active': $route.path === '/requester' }" to="/requester"
					>My Requests</RouterLink
				>
				<RouterLink v-if="userStore.isValidator" class="nav-link" :class="{ 'nav-link-active': $route.path === '/validator' }" to="/validator"
					>Manage Requests</RouterLink
				>
			</nav>
		</header>

		<main class="main-content">
			<RouterView />
		</main>
	</div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useUserStore } from "./stores/user";
import { useRouter } from "vue-router";

const router = useRouter();
const userStore = useUserStore();
const selectedUserId = ref(null);

function onUserChange() {
	console.log("user changed to", selectedUserId.value);
	userStore.selectUser(selectedUserId.value);
	if (userStore.isValidator) router.push("/validator");
	else router.push("/requester");
}

onMounted(() => {
	if (userStore.users.length) {
		selectedUserId.value = userStore.currentUserId;
	}
});

watch(
	() => userStore.currentUserId,
	(id) => {
		selectedUserId.value = id;
	},
);
</script>

<style>
:root {
	--nav-background: #2c3e50;
	--primary-color: #3498db;
	--danger-color: #e74c3c;
	--good-color: #2ecc71;
	--text-color: #333;
	--ghost-color: #7a7e81;
	--white: #fff;
}

* {
	font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
	text-decoration: none;
}

body {
	margin: 0;
}

#app-shell {
	display: flex;
	height: 100dvh;
}

.main-content {
	flex: 1;
	background: #ecf0f1;
}

.navbar {
	display: flex;
	flex-direction: column;
	width: fit-content;
	background: var(--nav-background);
	gap: 20px;
	padding: 15px 10px 0 0;

	* {
		color: var(--white);
		padding-left: 5px;
	}

	&& .user-select,
	&& .user-select option {
		border: none;
		padding: 3px;
		border-radius: 5px;
		color: var(--text-color);
		margin-top: 3px;
	}
}

.nav-links {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 0;
}

.nav-link-active {
	font-weight: bold;
	background-color: var(--primary-color);
	width: 100%;
	padding: 5px;
}

.user-picker {
	display: flex;
	flex-direction: column;
}

.input-error {
	border-color: var(--danger-color) !important;
}

.badge {
	border-radius: 5px;
	width: 100%;
	height: 50%;
	padding: 3px;
}

.badge-pending {
	background-color: var(--primary-color);
}

.badge-approved {
	background-color: var(--good-color);
}

.badge-rejected {
	background-color: var(--danger-color);
}

.muted {
	color: var(--ghost-color);
}

.alert {
	padding: 10px;
	border-radius: 5px;
	margin: 10px auto;
	width: 80%;
}

.alert-success {
	background-color: var(--good-color);
	color: var(--white);
}

.alert-error {
	background-color: var(--danger-color);
	color: var(--white);
}

@media only screen and (max-width: 1024px) {
	#app-shell {
		flex-direction: column-reverse;
	}

	.navbar {
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		width: 100%;
		padding: 0;
		position: sticky;
		bottom: 0;
	}

	.user-picker {
		flex-direction: row;
		gap: 10px;
		align-items: center;
	}

	.nav-links {
		height: 50px;
		background-color: var(--primary-color);
		justify-content: center;
		padding: 0 5px;
		&& .nav-link {
			text-align: center;
			padding: 0;
		}
	}
}
</style>
