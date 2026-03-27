<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';

	let { children } = $props();

	const navItems = [{ href: '/agents', label: 'Agents' }];
</script>

<div class="flex h-screen overflow-hidden bg-background text-foreground">
	<!-- Sidebar -->
	<aside class="flex w-56 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
		<!-- Logo -->
		<div class="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
			<svg
				viewBox="0 0 60 44"
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-auto flex-shrink-0 text-brand"
				fill="currentColor"
				aria-hidden="true"
			>
				<!-- Ear -->
				<ellipse cx="44" cy="7" rx="5" ry="6" />
				<!-- Head -->
				<rect x="34" y="8" width="22" height="18" rx="5" />
				<!-- Body -->
				<ellipse cx="21" cy="24" rx="21" ry="12" />
				<!-- Eye -->
				<circle cx="50" cy="14" r="2.2" fill="var(--sidebar)" />
				<!-- Front legs -->
				<rect x="43" y="33" width="7" height="9" rx="3" />
				<rect x="32" y="33" width="7" height="9" rx="3" />
				<!-- Back legs -->
				<rect x="11" y="33" width="7" height="9" rx="3" />
				<rect x="1" y="33" width="7" height="9" rx="3" />
			</svg>
			<span class="text-lg font-bold tracking-tight text-sidebar-foreground">Herd</span>
		</div>

		<!-- Nav -->
		<nav class="flex-1 px-2 py-3">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors
					{page.url.pathname.startsWith(item.href)
						? 'bg-sidebar-accent text-sidebar-foreground'
						: 'text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- Footer -->
		<div class="border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
			Herd v0.1
		</div>
	</aside>

	<!-- Main -->
	<main class="flex flex-1 flex-col overflow-auto">
		{@render children()}
	</main>
</div>
