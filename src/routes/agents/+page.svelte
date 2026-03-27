<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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
</script>

<svelte:head>
	<title>Agents — Herd</title>
</svelte:head>

<div class="flex-1 p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-xl font-semibold text-foreground">Agents</h1>
		<span class="text-sm text-muted-foreground">
			{data.agents.length} enrolled
		</span>
	</div>

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
				<a
					href="/agents/{agent.id}"
					class="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80 hover:bg-card/80"
				>
					<!-- Card header -->
					<div class="mb-3 flex items-start justify-between gap-2">
						<h2 class="truncate text-sm font-semibold text-card-foreground" title={agent.hostname}>
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
			{/each}
		</div>
	{/if}
</div>
