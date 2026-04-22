import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { backend } from '$lib/server/backend';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async () => {
	try {
		const agents = await backend.listAgents();
		return { agents, error: null };
	} catch (e) {
		return { agents: [], error: String(e) };
	}
};

export const actions: Actions = {
	bulkDispatch: async ({ request }) => {
		const form = await request.formData();
		const agentIds = form.getAll('agents').map(String).filter(Boolean);
		const instruction = String(form.get('instruction') ?? '').trim();
		const arg = form.get('arg') ? String(form.get('arg')).trim() : '';

		if (!instruction) return fail(400, { error: 'Instruction is required' });
		if (agentIds.length === 0) return fail(400, { error: 'No agents selected' });

		const results = await Promise.allSettled(
			agentIds.map((id) =>
				backend.postTask(id, {
					task_id: randomUUID(),
					assigned_at: new Date().toISOString().replace('+00:00', 'Z'),
					instruction,
					arg
				})
			)
		);

		const errors = results
			.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
			.map((r) => String(r.reason));

		return { dispatched: agentIds.length - errors.length, total: agentIds.length, errors };
	}
};
