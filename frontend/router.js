import { createRouter, createWebHistory } from "vue-router";
import RequesterView from "/views/RequesterView.vue";
import ValidatorView from "/views/ValidatorView.vue";
import { useUserStore } from "/stores/user";

const routes = [
	{
		path: "/",
		redirect: "/requester",
	},
	{
		path: "/requester",
		name: "Requester",
		component: RequesterView,
		meta: { title: "My Requests", role: "Requester" },
	},
	{
		path: "/validator",
		name: "Validator",
		component: ValidatorView,
		meta: { title: "Manage Requests", role: "Validator" },
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

// redirect based on role
router.beforeEach((to) => {
	const userStore = useUserStore();

	if (!to.meta.role || !userStore.currentUser) return true;

	if (userStore.currentUser.role !== to.meta.role) {
		return userStore.isValidator ? "/validator" : "/requester";
	}

	return true;
});

router.afterEach((to) => {
	document.title = `${to.meta.title || "Vacation Manager"} - VacaManager`;
});

export default router;
