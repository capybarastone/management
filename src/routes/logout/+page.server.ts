import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { getSessionId, deleteSession, deleteSessionCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		const sessionId = getSessionId(cookies);
		if (sessionId) {
			await deleteSession(sessionId);
		}
		deleteSessionCookie(cookies);
		redirect(302, '/login');
	}
};