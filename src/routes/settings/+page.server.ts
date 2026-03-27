import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { backend } from '$lib/server/backend';

export const load: PageServerLoad = async () => {
	try {
		const config = await backend.getCronConfig();
		return { config, error: null };
	} catch (e) {
		return { config: { inventory_interval: 30, page_refresh_interval: 10 }, error: String(e) };
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
	}
};
