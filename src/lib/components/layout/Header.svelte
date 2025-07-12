<script>
  import ModeToggle from '$lib/components/ModeToggle.svelte';
</script>

<header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-10">
  <div class="container mx-auto px-6 py-4">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl tracking-tight">
        <a href="/"><span class="font-semibold text-accent-foreground">cwdb</span> index</a>
      </h1>
      <ModeToggle />
    </div>
  </div>
</header>
