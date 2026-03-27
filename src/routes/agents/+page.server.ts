import type { PageServerLoad } from './$types';
import { backend } from '$lib/server/backend';

export const load: PageServerLoad = async () => {
	try {
		const agents = await backend.listAgents();
		return { agents, error: null };
	} catch (e) {
		return { agents: [], error: String(e) };
	}
};
