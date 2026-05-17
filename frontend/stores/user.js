import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getUsers } from "/services";

export const useUserStore = defineStore("user", () => {
	const users = ref([]);
	const currentUserId = ref(null);

	const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value) || null);

	const isValidator = computed(() => currentUser.value?.role === "Validator");
	const isRequester = computed(() => currentUser.value?.role === "Requester");

	function loadUsers() {
		return getUsers().then(({ data }) => {
			users.value = data.data;
			const saved = localStorage.getItem("currentUserId");
			if (saved) currentUserId.value = parseInt(saved);
			else currentUserId.value = users.value[0]?.id;
		});
	}

	function selectUser(id) {
		currentUserId.value = id;
		localStorage.setItem("currentUserId", id);
	}

	return { users, currentUserId, currentUser, isValidator, isRequester, loadUsers, selectUser };
});
