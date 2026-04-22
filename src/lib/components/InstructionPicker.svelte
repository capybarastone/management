<script lang="ts">
	let {
		instruction = $bindable('syscall'),
		arg = $bindable(''),
		idPrefix = 'instruction-picker'
	}: {
		instruction?: string;
		arg?: string;
		idPrefix?: string;
	} = $props();
</script>

<div>
	<label for="{idPrefix}-instruction" class="mb-1 block text-xs text-muted-foreground">
		Instruction
	</label>
	<select
		id="{idPrefix}-instruction"
		name="instruction"
		bind:value={instruction}
		class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
	>
		<option value="syscall">syscall</option>
		<option value="exit">exit</option>
		<option value="install_av">install_av</option>
		<option value="av_scan">av_scan</option>
	</select>
</div>

{#if instruction === 'syscall'}
	<div>
		<label for="{idPrefix}-arg" class="mb-1 block text-xs text-muted-foreground">Command</label>
		<input
			id="{idPrefix}-arg"
			name="arg"
			type="text"
			bind:value={arg}
			placeholder="e.g. uname -a"
			class="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
		/>
	</div>
{:else if instruction === 'av_scan'}
	<div>
		<label for="{idPrefix}-arg" class="mb-1 block text-xs text-muted-foreground">
			Scan path <span class="text-muted-foreground/60">(leave blank for full scan)</span>
		</label>
		<input
			id="{idPrefix}-arg"
			name="arg"
			type="text"
			bind:value={arg}
			placeholder="e.g. /home"
			class="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
		/>
	</div>
{:else}
	<input type="hidden" name="arg" value="" />
{/if}
