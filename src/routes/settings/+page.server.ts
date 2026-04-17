import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { backend } from '$lib/server/backend';
import { getUsers, createUser, deleteUser } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	try {
		const config = await backend.getCronConfig();
		const users = await getUsers();
		return { config, users, error: null };
	} catch (e) {
		const users = await getUsers().catch(() => []);
		return { config: { inventory_interval: 30, page_refresh_interval: 10 }, users, error: String(e) };
	}
};

export const actions: Actions = {
	saveCron: async ({ request }) => {
		const form = await request.formData();
		const invRaw = form.get('inventory_interval');
		const refreshRaw = form.get('page_refresh_interval');
		const inv = invRaw ? parseInt(String(invRaw), 10) : NaN;
		const refresh = refreshRaw ? parseInt(String(refreshRaw), 10) : 0;

		if (isNaN(inv) || inv < 5) {
			return fail(400, { error: 'Inventory interval must be a number ≥ 5 seconds' });
		}
		if (isNaN(refresh) || (refresh !== 0 && refresh < 3)) {
			return fail(400, { error: 'Page refresh must be 0 (disabled) or ≥ 3 seconds' });
		}

		try {
			const config = await backend.patchCronConfig({
				inventory_interval: inv,
				page_refresh_interval: refresh
			});
			return { saved: true, config };
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},
	addUser: async ({ request }) => {
		const form = await request.formData();
		const username = form.get('username')?.toString();
		const password = form.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { userError: 'Username and password required' });
		}

		try {
			await createUser(username, password);
			return { userSaved: true };
		} catch (e) {
			return fail(400, { userError: e instanceof Error ? e.message : 'Failed to create user' });
		}
	},
	deleteUser: async ({ request }) => {
		const form = await request.formData();
		const userId = form.get('userId')?.toString();

		if (!userId) {
			return fail(400, { userError: 'User ID required' });
		}

		try {
			await deleteUser(userId);
			return { userDeleted: true };
		} catch (e) {
			return fail(400, { userError: e instanceof Error ? e.message : 'Failed to delete user' });
		}
	}
};
