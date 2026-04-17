<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';

	let { children, data } = $props();

	const navItems = [
		{ href: '/agents', label: 'Agents' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<div class="flex h-screen overflow-hidden bg-background text-foreground">
	<!-- Sidebar -->
	<aside class="flex w-56 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
		<!-- Logo -->
		<div class="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
			<img src="/favicon.svg" alt="Herd" class="h-8 w-8 flex-shrink-0" />
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
		<div class="border-t border-sidebar-border px-4 py-3">
			<form action="/logout" method="POST">
				<button
					type="submit"
					class="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
				>
					Logout
				</button>
			</form>
			<div class="mt-2 text-xs text-muted-foreground">
				Herd v0.1
			</div>
		</div>
	</aside>

	<!-- Main -->
	<main class="flex flex-1 flex-col overflow-auto">
		{@render children()}
	</main>
</div>
