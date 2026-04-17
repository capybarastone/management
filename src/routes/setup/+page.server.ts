import type { Actions } from './$types';
import { createUser } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const password = formData.get('password')?.toString();

		if (!username || !password) {
			return { error: 'Username and password required' };
		}

		try {
			await createUser(username, password);
			return { success: true };
		} catch (e) {
			return { error: e instanceof Error ? e.message : 'Failed to create user' };
		}
	}
};