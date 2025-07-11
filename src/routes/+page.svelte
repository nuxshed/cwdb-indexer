<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { IconHome, IconFile, IconFolder } from '@tabler/icons-svelte';

  type FileEntry = {
    id: string;
    filename: string;
    path: string;
    repo: string;
    owner: string;
    url: string;
    tags: {
      course: string;
      shortCourse: string;
      type: string;
    };
    fullPath: string;
  };

  let files: FileEntry[] = [];
  let currentPath: string = '';
  let currentItems: Array<{name: string, isFile: boolean, file?: FileEntry}> = [];

  function getCurrentItems() {
    const items = new Map<string, {name: string, isFile: boolean, file?: FileEntry}>();
    
    files.forEach(file => {
      if (currentPath === '') {
        const topLevel = file.fullPath.split('/').slice(0,2).join('/');
        if (!items.has(topLevel)) {
          items.set(topLevel, {name: topLevel, isFile: false});
        }
      } else if (file.fullPath.startsWith(currentPath + '/')) {
        const relativePath = file.fullPath.substring(currentPath.length + 1);
        const firstPart = relativePath.split('/')[0];
        
        if (relativePath === firstPart) {
          items.set(firstPart, {name: firstPart, isFile: true, file});
        } else {
          if (!items.has(firstPart)) {
            items.set(firstPart, {name: firstPart, isFile: false});
          }
        }
      }
    });

    return Array.from(items.values()).sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }

  function navigateToDirectory(dirName: string) {
    if (currentPath === '') {
      currentPath = dirName;
    } else {
      currentPath = currentPath + '/' + dirName;
    }
    currentItems = getCurrentItems();
  }

  function navigateToBreadcrumb(index: number) {
    const pathParts = currentPath.split('/');
    currentPath = pathParts.slice(0, index + 1).join('/');
    currentItems = getCurrentItems();
  }

  function navigateToRoot() {
    currentPath = '';
    currentItems = getCurrentItems();
  }

  onMount(async () => {
    // FIXME:? is there a way to not hardcode ts
    const fileNames = [
      'sanyamseac.exams2k24.json',
    ];

    const allFiles = await Promise.all(
      fileNames.map(async (name) => {
        const res = await fetch(`/data/${name}`);
        return res.ok ? await res.json() : [];
      })
    );

    files = allFiles.flat().map((file: any) => {
      const idParts = file.id.split('/');
      let fullPath = file.id;
      if (idParts.length >= 3) {
        fullPath = idParts.slice(0,2).join('/') + '/' + idParts.slice(2).join('/').replace(/^.*?\//, '');
      }
      return { ...file, fullPath };
    });
    currentItems = getCurrentItems();
  });

  $: breadcrumbs = currentPath ? currentPath.split('/') : [];
</script>

<main class="mb-10 bg-background text-foreground flex flex-col items-center">
  <div class="w-full max-w-4xl px-8">
    <!-- breadcrumbs -->
    <nav class="mb-6 flex items-center gap-1 text-xs font-medium text-muted-foreground select-none">
      <button class="flex items-center gap-1 hover:text-foreground transition-colors" on:click={navigateToRoot} aria-label="Root">
        <IconHome size={16} class="opacity-70" />
        Root
      </button>
      {#each breadcrumbs as crumb, index}
        <span class="mx-1">/</span>
        <button 
          class="hover:text-foreground transition-colors"
          on:click={() => navigateToBreadcrumb(index)}
        >
          {crumb}
        </button>
      {/each}
    </nav>

    <!-- dir contents -->
    <div class="space-y-2">
      {#each currentItems as item}
        {#if item.isFile}
          <Card class="group p-0 bg-card border border-muted rounded-lg shadow-none transition-colors">
            <CardContent class="p-0">
              <div class="flex items-center gap-3 px-4 py-3">
                <IconFile size={18} class="text-muted-foreground group-hover:text-foreground transition-colors" />
                <div class="flex flex-col">
                  <span class="font-medium text-foreground group-hover:text-foreground text-sm">{item.name}</span>
                  <span class="text-xs text-muted-foreground group-hover:text-foreground/70">{item.file?.repo} / {item.file?.owner}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        {:else}
          <button class="w-full text-left group" on:click={() => navigateToDirectory(item.name)}>
            <Card class="p-0 bg-card border border-muted rounded-lg shadow-none transition-colors">
              <CardContent class="p-0">
                <div class="flex items-center gap-3 px-4 py-3">
                  <IconFolder size={18} class="text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span class="font-medium text-foreground group-hover:text-foreground text-sm">{item.name}</span>
                </div>
              </CardContent>
            </Card>
          </button>
        {/if}
      {/each}
    </div>
  </div>
</main>
