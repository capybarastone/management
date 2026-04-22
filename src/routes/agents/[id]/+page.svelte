<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData, ActionData } from './$types';
	import type { Task } from '$lib/server/backend';
	import InstructionPicker from '$lib/components/InstructionPicker.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let expandedTask = $state<string | null>(null);

	$effect(() => {
		const interval = data.refresh_interval;
		if (!interval || interval <= 0) return;
		const id = setInterval(() => invalidateAll(), interval * 1000);
		return () => clearInterval(id);
	});

	function isOnline(lastSeen: string): boolean {
		return Date.now() - new Date(lastSeen).getTime() < 90_000;
	}

	function timeAgo(ts: string): string {
		if (!ts) return '—';
		const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	}

	function taskStatus(task: Task): { label: string; cls: string } {
		if (!task.responded) return { label: 'Pending', cls: 'bg-yellow-500/15 text-yellow-400' };
		if (task.exit_code === 0 || task.exit_code === null)
			return { label: 'Done', cls: 'bg-green-500/15 text-green-400' };
		return { label: `Exit ${task.exit_code}`, cls: 'bg-destructive/20 text-destructive' };
	}

	// ── Inventory gauge helpers ──────────────────────────────────────────────

	function parseMemoryPct(s: string): number | null {
		const m = s?.match(/\((\d+)%\)/);
		return m ? parseInt(m[1]) : null;
	}

	function parseDiskPct(s: string): number | null {
		const m = s?.trim().match(/^(\d+)%/);
		return m ? parseInt(m[1]) : null;
	}

	function parseCpuCount(s: string): number | null {
		const n = parseInt(s?.trim());
		return isNaN(n) ? null : n;
	}

	function parseCpuUsagePct(s: string): number | null {
		const m = s?.trim().match(/^(\d+)%/);
		return m ? parseInt(m[1]) : null;
	}

	function gaugeColor(pct: number): string {
		if (pct >= 85) return 'bg-destructive';
		if (pct >= 65) return 'bg-yellow-500';
		return 'bg-primary';
	}

	// Most recent completed inventory task
	const latestInventory = $derived(
		[...(data.agent?.tasks ?? [])]
			.filter((t) => t.instruction === 'inventory' && t.responded && t.inventory)
			.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())
			.at(0)?.inventory ?? null
	);

	// Sorted task list — pending first, then newest first; hide inventory tasks
	const sortedTasks = $derived(
		[...(data.agent?.tasks ?? [])]
			.filter((t) => t.instruction !== 'inventory')
			.sort((a, b) => {
				if (!a.responded && b.responded) return -1;
				if (a.responded && !b.responded) return 1;
				return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
			})
	);
</script>

<svelte:head>
	<title>{data.agent?.hostname ?? 'Agent'} — Herd</title>
</svelte:head>

<div class="flex-1 overflow-auto p-6">
	<div class="mb-6">
		<a href="/agents" class="text-xs text-muted-foreground hover:text-foreground">← Agents</a>

		{#if data.error || !data.agent}
			<div
				class="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{data.error ?? 'Agent not found'}
			</div>
		{:else}
			{@const agent = data.agent}
			{@const online = isOnline(agent.last_seen)}

			<div class="mt-2 flex items-center gap-3">
				<h1 class="text-xl font-semibold">{agent.hostname}</h1>
				{#if data.refresh_interval > 0}
					<span class="text-xs text-muted-foreground">↻ {data.refresh_interval}s</span>
				{/if}
				{#if agent.blacklisted}
					<span class="rounded px-2 py-0.5 text-xs font-medium bg-destructive/20 text-destructive">
						Blacklisted
					</span>
				{:else if online}
					<span
						class="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400"
					>
						<span class="inline-block h-1.5 w-1.5 rounded-full bg-green-400"></span>
						Online
					</span>
				{:else}
					<span class="rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
						Offline
					</span>
				{/if}
			</div>

			<!-- Info + Gauges + Dispatch grid -->
			<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
				<!-- Agent info -->
				<div class="rounded-lg border border-border bg-card p-4">
					<h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Agent Info
					</h2>
					<dl class="space-y-2 text-sm">
						<div>
							<dt class="text-xs text-muted-foreground">Agent ID</dt>
							<dd class="mt-0.5 font-mono text-xs break-all">{agent.id}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted-foreground">IP Address</dt>
							<dd class="font-mono">{agent.ip_address}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted-foreground">OS</dt>
							<dd>{agent.os_name || agent.os}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted-foreground">Registered</dt>
							<dd title={agent.registered_at}>{timeAgo(agent.registered_at)}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted-foreground">Last Seen</dt>
							<dd title={agent.last_seen}>{timeAgo(agent.last_seen)}</dd>
						</div>
					</dl>
				</div>

				<!-- Host health gauges -->
				<div class="rounded-lg border border-border bg-card p-4">
					<h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Host Health
					</h2>

					{#if latestInventory}
						{@const memPct = parseMemoryPct(String(latestInventory.memory_use ?? ''))}
						{@const diskPct = parseDiskPct(String(latestInventory.disk_usage ?? ''))}
						{@const cpuUsagePct = parseCpuUsagePct(String(latestInventory.cpu_usage ?? ''))}
						{@const cpuCount = parseCpuCount(String(latestInventory.cpu_count ?? ''))}

						<div class="space-y-4">
							{#if memPct !== null}
								<div>
									<div class="mb-1 flex justify-between text-xs">
										<span class="text-muted-foreground">Memory</span>
										<span
											class={memPct >= 85
												? 'text-destructive'
												: memPct >= 65
													? 'text-yellow-400'
													: 'text-foreground'}>{memPct}%</span
										>
									</div>
									<div class="h-2 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full transition-all {gaugeColor(memPct)}"
											style="width: {memPct}%"
										></div>
									</div>
									<p class="mt-0.5 text-xs text-muted-foreground">
										{latestInventory.memory_use}
									</p>
								</div>
							{/if}

							{#if diskPct !== null}
								<div>
									<div class="mb-1 flex justify-between text-xs">
										<span class="text-muted-foreground">Disk</span>
										<span
											class={diskPct >= 85
												? 'text-destructive'
												: diskPct >= 65
													? 'text-yellow-400'
													: 'text-foreground'}>{diskPct}%</span
										>
									</div>
									<div class="h-2 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full transition-all {gaugeColor(diskPct)}"
											style="width: {diskPct}%"
										></div>
									</div>
								</div>
							{/if}

							{#if cpuUsagePct !== null}
								<div>
									<div class="mb-1 flex justify-between text-xs">
										<span class="text-muted-foreground">CPU Usage</span>
										<span
											class={cpuUsagePct >= 85
												? 'text-destructive'
												: cpuUsagePct >= 65
													? 'text-yellow-400'
													: 'text-foreground'}>{cpuUsagePct}%</span
										>
									</div>
									<div class="h-2 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full transition-all {gaugeColor(cpuUsagePct)}"
											style="width: {cpuUsagePct}%"
										></div>
									</div>
								</div>
							{/if}

							{#if cpuCount !== null}
								<div class="flex items-center justify-between text-xs">
									<span class="text-muted-foreground">CPU Cores</span>
									<span class="font-mono">{cpuCount}</span>
								</div>
							{/if}

							<p class="text-xs text-muted-foreground" title={latestInventory.assigned_at as string ?? ''}>
								Updated {timeAgo(
									(data.agent.tasks.find(
										(t) => t.inventory === latestInventory
									)?.stopped_processing_at) ?? ''
								)}
							</p>
						</div>
					{:else}
						<p class="text-xs text-muted-foreground">
							Waiting for first inventory result…
						</p>
					{/if}
				</div>

				<!-- Dispatch form -->
				<div class="rounded-lg border border-border bg-card p-4">
					<h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Dispatch Task
					</h2>

					{#if form?.dispatched}
						<div class="mb-3 rounded bg-green-500/15 px-3 py-2 text-xs text-green-400">
							Task queued — ID: <span class="font-mono">{form.task_id?.slice(0, 8)}…</span>
						</div>
					{/if}
					{#if form?.error}
						<div class="mb-3 rounded bg-destructive/15 px-3 py-2 text-xs text-destructive">
							{form.error}
						</div>
					{/if}

					<form method="POST" action="?/dispatch" use:enhance class="space-y-3">
						<InstructionPicker idPrefix="dispatch" />

						<button
							type="submit"
							class="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
						>
							Run Task
						</button>
					</form>
				</div>
			</div>

			<!-- Tasks table (syscall/exit only) -->
			<div class="mt-4 rounded-lg border border-border bg-card">
				<div class="flex items-center justify-between border-b border-border px-4 py-3">
					<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Tasks
					</h2>
					<span class="text-xs text-muted-foreground">{sortedTasks.length} shown</span>
				</div>

				{#if sortedTasks.length === 0}
					<p class="px-4 py-8 text-center text-sm text-muted-foreground">No tasks yet.</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border text-left text-xs text-muted-foreground">
									<th class="px-4 py-2 font-medium">ID</th>
									<th class="px-4 py-2 font-medium">Instruction</th>
									<th class="px-4 py-2 font-medium">Arg</th>
									<th class="px-4 py-2 font-medium">Status</th>
									<th class="px-4 py-2 font-medium">Assigned</th>
								</tr>
							</thead>
							<tbody>
								{#each sortedTasks as task}
									{@const status = taskStatus(task)}
									<tr
										class="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
										onclick={() =>
											(expandedTask = expandedTask === task.task_id ? null : task.task_id)}
									>
										<td class="px-4 py-2.5 font-mono text-xs text-muted-foreground">
											{task.task_id.slice(0, 8)}…
										</td>
										<td class="px-4 py-2.5 font-mono">{task.instruction}</td>
										<td
											class="max-w-[12rem] truncate px-4 py-2.5 text-muted-foreground"
											title={task.arg ?? ''}
										>
											{task.arg || '—'}
										</td>
										<td class="px-4 py-2.5">
											<span class="rounded px-1.5 py-0.5 text-xs font-medium {status.cls}">
												{status.label}
											</span>
										</td>
										<td class="px-4 py-2.5 text-muted-foreground" title={task.assigned_at}>
											{timeAgo(task.assigned_at)}
										</td>
									</tr>

									{#if expandedTask === task.task_id}
										<tr class="bg-muted/20">
											<td colspan="5" class="px-4 py-3">
												<div class="space-y-2">
													{#if task.stdout}
														<div>
															<p class="mb-1 text-xs font-medium text-muted-foreground">stdout</p>
															<pre
																class="max-h-48 overflow-auto rounded bg-background p-2 text-xs">{task.stdout}</pre>
														</div>
													{/if}
													{#if task.stderr}
														<div>
															<p class="mb-1 text-xs font-medium text-destructive">stderr</p>
															<pre
																class="max-h-48 overflow-auto rounded bg-background p-2 text-xs text-destructive/80">{task.stderr}</pre>
														</div>
													{/if}
													{#if !task.stdout && !task.stderr}
														<p class="text-xs text-muted-foreground">No output.</p>
													{/if}
												</div>
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
