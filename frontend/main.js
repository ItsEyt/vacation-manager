import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "/stores/user";

const app = createApp(App);
app.use(createPinia());
app.use(router);

const userStore = useUserStore();
userStore.loadUsers().then(() => {
	// select first user by default
	if (userStore.users.length && !userStore.currentUserId) {
		userStore.selectUser(userStore.users[0].id);
	}
	app.mount("#app");

	if (userStore.isValidator) router.push("/validator");
	else router.push("/requester");
});
