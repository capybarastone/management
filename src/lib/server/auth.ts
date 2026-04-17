import type { Cookies } from '@sveltejs/kit';
import crypto from 'node:crypto';

const SESSION_COOKIE = 'session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours

export interface Session {
	id: string;
	userId: string;
	expiresAt: number;
}

export interface User {
	id: string;
	username: string;
	passwordHash: string;
	createdAt: string;
}

function parseUsers(fileContents: string): User[] {
	try {
		return JSON.parse(fileContents);
	} catch {
		return [];
	}
}

function stringifyUsers(users: User[]): string {
	return JSON.stringify(users, null, 2);
}

export function getUsersDir(): string {
	return process.env.MANAGEMENT_DATA_DIR ?? '/home/matt/capstone/management/data';
}

export function getUsersFile(): string {
	return `${getUsersDir()}/users.json`;
}

export function getSessionsFile(): string {
	return `${getUsersDir()}/sessions.json`;
}

export async function getUsers(): Promise<User[]> {
	const fs = await import('node:fs/promises');
	const dir = getUsersDir();
	try {
		await fs.access(dir);
	} catch {
		await fs.mkdir(dir, { recursive: true });
	}
	try {
		const data = await fs.readFile(getUsersFile(), 'utf-8');
		return parseUsers(data);
	} catch {
		return [];
	}
}

export async function saveUsers(users: User[]): Promise<void> {
	const fs = await import('node:fs/promises');
	await fs.writeFile(getUsersFile(), stringifyUsers(users));
}

export async function createUser(username: string, password: string): Promise<User> {
	const bcrypt = await import('bcrypt');
	const users = await getUsers();
	if (users.find((u) => u.username === username)) {
		throw new Error('Username already exists');
	}
	const user: User = {
		id: crypto.randomUUID(),
		username,
		passwordHash: await bcrypt.hash(password, 10),
		createdAt: new Date().toISOString()
	};
	users.push(user);
	await saveUsers(users);
	return user;
}

export async function verifyUser(username: string, password: string): Promise<User | null> {
	const bcrypt = await import('bcrypt');
	const users = await getUsers();
	const user = users.find((u) => u.username === username);
	if (!user) return null;
	const valid = await bcrypt.compare(password, user.passwordHash);
	return valid ? user : null;
}

function parseSessions(fileContents: string): Session[] {
	try {
		return JSON.parse(fileContents);
	} catch {
		return [];
	}
}

export async function getSessions(): Promise<Session[]> {
	const fs = await import('node:fs/promises');
	try {
		const data = await fs.readFile(getSessionsFile(), 'utf-8');
		return parseSessions(data);
	} catch {
		return [];
	}
}

export async function saveSessions(sessions: Session[]): Promise<void> {
	const fs = await import('node:fs/promises');
	await fs.writeFile(getSessionsFile(), JSON.stringify(sessions, null, 2));
}

export async function createSession(userId: string): Promise<Session> {
	const sessions = await getSessions();
	const now = Date.now();
	const session: Session = {
		id: crypto.randomUUID(),
		userId,
		expiresAt: now + SESSION_DURATION_MS
	};
	sessions.push(session);
	await saveSessions(sessions);
	return session;
}

export async function getSession(id: string): Promise<Session | null> {
	const sessions = await getSessions();
	return sessions.find((s) => s.id === id && s.expiresAt > Date.now()) ?? null;
}

export async function deleteSession(id: string): Promise<void> {
	const sessions = await getSessions();
	const filtered = sessions.filter((s) => s.id !== id);
	await saveSessions(filtered);
}

export async function deleteUser(userId: string): Promise<void> {
	const users = await getUsers();
	const filtered = users.filter((u) => u.id !== userId);
	if (filtered.length === users.length) {
		throw new Error('User not found');
	}
	await saveUsers(filtered);
}

export async function cleanupSessions(): Promise<void> {
	const sessions = await getSessions();
	const now = Date.now();
	const filtered = sessions.filter((s) => s.expiresAt > now);
	await saveSessions(filtered);
}

export function createSessionCookie(cookies: Cookies, session: Session): void {
	cookies.set(SESSION_COOKIE, session.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DURATION_MS / 1000
	});
}

export function getSessionId(cookies: Cookies): string | undefined {
	return cookies.get(SESSION_COOKIE);
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}