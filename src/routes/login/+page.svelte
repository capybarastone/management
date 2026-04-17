<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
		<div class="mb-6 flex items-center gap-3">
			<img src="/favicon.svg" alt="Herd" class="h-8 w-8" />
			<h1 class="text-2xl font-bold text-foreground">Herd Management</h1>
		</div>

		<form method="POST" class="space-y-4">
			{#if form?.error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}

			<div>
				<label for="username" class="block text-sm font-medium text-foreground">Username</label>
				<input
					type="text"
					id="username"
					name="username"
					autocomplete="username"
					required
					class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-foreground">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					autocomplete="current-password"
					required
					class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
			>
				Sign In
			</button>
		</form>
	</div>
</div>