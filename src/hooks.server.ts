import type { Handle } from '@sveltejs/kit';
import { getSessionId, getSession, getUsers } from '$lib/server/auth';
import { existsSync } from 'node:fs';

const PUBLIC_ROUTES = ['/login', '/setup'];

async function hasUsers(): Promise<boolean> {
	const fs = await import('node:fs');
	const dataDir = process.env.MANAGEMENT_DATA_DIR ?? '/home/matt/capstone/management/data';
	const usersFile = `${dataDir}/users.json`;
	try {
		const content = fs.readFileSync(usersFile, 'utf-8');
		const users = JSON.parse(content);
		return Array.isArray(users) && users.length > 0;
	} catch {
		return false;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = getSessionId(event.cookies);

	if (sessionId) {
		const session = await getSession(sessionId);
		if (session) {
			const users = await getUsers();
			const user = users.find((u) => u.id === session.userId);
			if (user) {
				event.locals.user = { id: user.id, username: user.username };
			}
		}
	}

	const isPublicRoute = PUBLIC_ROUTES.some((route) => event.url.pathname === route);

	if (isPublicRoute) {
		if (event.locals.user) {
			return new Response(null, {
				status: 302,
				headers: { Location: '/' }
			});
		}
		if (event.url.pathname === '/login') {
			const usersExist = await hasUsers();
			if (!usersExist) {
				return new Response(null, {
					status: 302,
					headers: { Location: '/setup' }
				});
			}
		}
		if (event.url.pathname === '/setup') {
			const usersExist = await hasUsers();
			if (usersExist) {
				return new Response(null, {
					status: 302,
					headers: { Location: '/login' }
				});
			}
		}
		return resolve(event);
	}

	if (!event.locals.user) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/login' }
		});
	}

	return resolve(event);
};

declare global {
	namespace App {
		interface Locals {
			user?: { id: string; username: string };
		}
	}
}