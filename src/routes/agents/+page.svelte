<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import InstructionPicker from '$lib/components/InstructionPicker.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function isOnline(lastSeen: string): boolean {
		return Date.now() - new Date(lastSeen).getTime() < 90_000;
	}

	function timeAgo(ts: string): string {
		const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	}

	const osIcon: Record<string, string> = {
		linux: 'L',
		windows: 'W',
		darwin: 'M'
	};

	let selected = $state(new Set<string>());
	let showModal = $state(false);
	let modalInstruction = $state('syscall');
	let modalArg = $state('');

	const allSelected = $derived(data.agents.length > 0 && selected.size === data.agents.length);
	const someSelected = $derived(selected.size > 0 && selected.size < data.agents.length);

	let allCheckbox = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (allCheckbox) allCheckbox.indeterminate = someSelected;
	});

	function toggleAgent(id: string, checked: boolean) {
		const next = new Set(selected);
		if (checked) next.add(id);
		else next.delete(id);
		selected = next;
	}

	function toggleAll(checked: boolean) {
		selected = checked ? new Set(data.agents.map((a) => a.id)) : new Set();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (showModal && e.key === 'Escape') showModal = false;
	}}
/>

<svelte:head>
	<title>Agents — Herd</title>
</svelte:head>

<div class="flex-1 p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			{#if data.agents.length > 0}
				<label class="flex cursor-pointer items-center">
					<input
						bind:this={allCheckbox}
						type="checkbox"
						checked={allSelected}
						onchange={(e) => toggleAll((e.currentTarget as HTMLInputElement).checked)}
						class="h-4 w-4 cursor-pointer rounded accent-amber-500"
					/>
				</label>
			{/if}
			<h1 class="text-xl font-semibold text-foreground">Agents</h1>
		</div>
		<div class="flex items-center gap-3">
			{#if selected.size > 0}
				<button
					onclick={() => {
						modalInstruction = 'syscall';
						modalArg = '';
						showModal = true;
					}}
					class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
				>
					Dispatch to {selected.size}
				</button>
			{/if}
			<span class="text-sm text-muted-foreground">{data.agents.length} enrolled</span>
		</div>
	</div>

	{#if form?.error}
		<div
			class="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}
	{#if 'dispatched' in (form ?? {}) && !form?.error}
		<div
			class="mb-6 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400"
		>
			Dispatched {form?.dispatched} of {form?.total} task{form?.total === 1 ? '' : 's'}.{#if form?.errors?.length}
				{form.errors.length} failed.{/if}
		</div>
	{/if}
	{#if data.error}
		<div
			class="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			Could not reach backend: {data.error}
		</div>
	{/if}

	{#if data.agents.length === 0 && !data.error}
		<div class="flex flex-col items-center justify-center py-24 text-muted-foreground">
			<p class="text-sm">No agents enrolled yet.</p>
			<p class="mt-1 text-xs">Run the endpoint agent to enroll a machine.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.agents as agent}
				{@const online = isOnline(agent.last_seen)}
				<div
					class="relative rounded-lg border border-border bg-card transition-colors hover:border-border/80 hover:bg-card/80"
				>
					<!-- Checkbox overlaid in top-left corner -->
					<label class="absolute left-3 top-3.5 z-10 cursor-pointer">
						<input
							type="checkbox"
							checked={selected.has(agent.id)}
							onchange={(e) =>
								toggleAgent(agent.id, (e.currentTarget as HTMLInputElement).checked)}
							class="h-3.5 w-3.5 cursor-pointer rounded accent-amber-500"
						/>
					</label>

					<!-- Card link — left-padded to clear the checkbox -->
					<a href="/agents/{agent.id}" class="block p-4 pl-8">
						<!-- Card header -->
						<div class="mb-3 flex items-start justify-between gap-2">
							<h2
								class="truncate text-sm font-semibold text-card-foreground"
								title={agent.hostname}
							>
								{agent.hostname}
							</h2>
							{#if agent.blacklisted}
								<span
									class="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-destructive/20 text-destructive"
								>
									Blacklisted
								</span>
							{:else if online}
								<span
									class="flex items-center gap-1 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-green-500/15 text-green-400"
								>
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
									Online
								</span>
							{:else}
								<span
									class="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
								>
									Offline
								</span>
							{/if}
						</div>

						<!-- Details -->
						<div class="space-y-1 text-xs text-muted-foreground">
							<div class="flex items-center gap-1.5">
								<span
									class="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-muted text-[9px] font-bold uppercase"
								>
									{osIcon[agent.os?.toLowerCase()] ?? '?'}
								</span>
								<span class="truncate">{agent.os_name || agent.os || 'Unknown OS'}</span>
							</div>
							<div class="font-mono">{agent.ip_address}</div>
						</div>

						<!-- Footer -->
						<div class="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
							<span class="text-muted-foreground">
								{agent.tasks?.length ?? 0} task{agent.tasks?.length === 1 ? '' : 's'}
							</span>
							<span class="text-muted-foreground" title={agent.last_seen}>
								{timeAgo(agent.last_seen)}
							</span>
						</div>
					</a>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Bulk dispatch modal -->
{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		role="presentation"
		onclick={() => (showModal = false)}
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			class="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="modal-title" class="mb-4 text-base font-semibold text-card-foreground">
				Dispatch task to {selected.size} agent{selected.size === 1 ? '' : 's'}
			</h2>

			<form
				method="POST"
				action="?/bulkDispatch"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') {
							showModal = false;
							selected = new Set();
						}
					};
				}}
				class="space-y-4"
			>
				{#each [...selected] as id}
					<input type="hidden" name="agents" value={id} />
				{/each}

				<InstructionPicker bind:instruction={modalInstruction} bind:arg={modalArg} idPrefix="modal" />

				<div class="flex gap-2 pt-1">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
					>
						Dispatch
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
