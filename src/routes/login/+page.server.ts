import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyUser, createSession, createSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const password = formData.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Username and password required', username });
		}

		const user = await verifyUser(username, password);
		if (!user) {
			return fail(401, { error: 'Invalid credentials', username });
		}

		const session = await createSession(user.id);
		createSessionCookie(cookies, session);

		redirect(302, '/');
	}
};