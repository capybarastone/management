import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { backend } from '$lib/server/backend';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const agent = await backend.getAgent(params.id);
		return { agent, error: null };
	} catch (e) {
		return { agent: null, error: String(e) };
	}
};

export const actions: Actions = {
	dispatch: async ({ request, params }) => {
		const form = await request.formData();
		const instruction = String(form.get('instruction') ?? '').trim();
		const arg = form.get('arg') ? String(form.get('arg')).trim() : null;

		if (!instruction) {
			return fail(400, { error: 'Instruction is required' });
		}

		const task = {
			task_id: randomUUID(),
			assigned_at: new Date().toISOString().replace('+00:00', 'Z'),
			instruction,
			arg: arg || null
		};

		try {
			await backend.postTask(params.id, task);
			return { dispatched: true, task_id: task.task_id };
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
