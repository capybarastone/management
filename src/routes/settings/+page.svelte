<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let interval = $derived(data.config.inventory_interval);
	let refreshInterval = $derived(data.config.page_refresh_interval);
</script>

<svelte:head>
	<title>Settings — Herd</title>
</svelte:head>

<div class="flex-1 p-6">
	<div class="mb-6">
		<h1 class="text-xl font-semibold">Settings</h1>
	</div>

	{#if data.error}
		<div
			class="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			Could not reach backend: {data.error}
		</div>
	{/if}

	<div class="max-w-md space-y-4">
		<!-- Inventory cron -->
		<div class="rounded-lg border border-border bg-card p-4">
			<h2 class="mb-1 text-sm font-semibold">Inventory Polling</h2>
			<p class="mb-4 text-xs text-muted-foreground">
				How often to automatically dispatch an inventory task to each enrolled agent. Lower values
				give fresher gauge data at the cost of more backend I/O.
			</p>

			{#if form?.saved}
				<div class="mb-3 rounded bg-green-500/15 px-3 py-2 text-xs text-green-400">
					Saved — new interval: {form.config?.inventory_interval}s
				</div>
			{/if}
			{#if form?.error}
				<div class="mb-3 rounded bg-destructive/15 px-3 py-2 text-xs text-destructive">
					{form.error}
				</div>
			{/if}

			<form method="POST" action="?/saveCron" use:enhance class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="inv-interval" class="mb-1 block text-xs text-muted-foreground">
							Inventory interval (s, min 5)
						</label>
						<input
							id="inv-interval"
							name="inventory_interval"
							type="number"
							min="5"
							bind:value={interval}
							class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>
					<div>
						<label for="refresh-interval" class="mb-1 block text-xs text-muted-foreground">
							Page auto-refresh (s, 0 = off)
						</label>
						<input
							id="refresh-interval"
							name="page_refresh_interval"
							type="number"
							min="0"
							bind:value={refreshInterval}
							class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>
				</div>
				<button
					type="submit"
					class="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
				>
					Save
				</button>
			</form>
		</div>
	</div>
</div>
