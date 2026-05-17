<template>
	<div class="role-choice">
		<h2 class="card-title">Choose current role</h2>
        <input type="text" placeholder="Enter your name…" v-model="selectedUserId" @keyup.enter="onUserChange" class="user-select" />
	</div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const selectedUserId = ref(null);
const router = useRouter();

async function onUserChange() {
	if (!selectedUserId.value) return;
	
	try {
		const response = await fetch(`/api/users/${selectedUserId.value}`);
		if (!response.ok) throw new Error("User not found");
		
		const user = await response.json();
		
		if (user.role === "requester") {
			router.push("/requester");
		} else if (user.role === "validator") {
			router.push("/validator");
		}
	} catch (error) {
		console.error("Error fetching user:", error);
		alert("User not found");
	}
}



</script>

<style scoped>
.role-choice {
	width: 100%;
	display: flex;
	flex-direction: column;
	text-align: center;
}
.role-links {
	display: flex;
	gap: 1rem;
	justify-content: center;
	font-size: 1.2rem;
}
</style>
