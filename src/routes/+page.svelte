<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { IconHome, IconFile, IconFolder, IconDots, IconTag, IconTrash } from '@tabler/icons-svelte';
  import type { PageData } from './$types';

  export let data: PageData;

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
  let showTagModal: boolean = false;
  let showClearTagsModal: boolean = false;
  let selectedFile: FileEntry | null = null;
  let tagKey: string = '';
  let tagValue: string = '';

  const tagKeyOptions = [
    { value: 'course', label: 'Course' },
    { value: 'shortCourse', label: 'Short Course' },
    { value: 'type', label: 'Type' }
  ];

  $: {
    files = data.docs.map((file: any) => {
      return { ...file, fullPath: file.id };
    });
    currentItems = getCurrentItems();
  }

  function getCurrentItems() {
    const items = new Map<string, {name: string, isFile: boolean, file?: FileEntry}>();
    
    files.forEach(file => {
      if (currentPath === '') {
        const pathParts = file.fullPath.split('/');
        if (pathParts.length >= 2) {
          const topLevel = pathParts.slice(0, 2).join('/');
          if (!items.has(topLevel)) {
            items.set(topLevel, {name: topLevel, isFile: false});
          }
        }
      } else if (file.fullPath.startsWith(currentPath + '/')) {
        const relativePath = file.fullPath.substring(currentPath.length + 1);
        const nextLevel = relativePath.split('/')[0];
        
        if (relativePath === nextLevel) {
          items.set(nextLevel, {name: nextLevel, isFile: true, file});
        } else {
          if (!items.has(nextLevel)) {
            items.set(nextLevel, {name: nextLevel, isFile: false});
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

  function openTagModal(file: FileEntry) {
    selectedFile = file;
    showTagModal = true;
  }

  function openFolderTagModal(folderPath: string) {
    selectedFile = {
      id: folderPath,
      filename: folderPath.split('/').pop() || folderPath,
      path: folderPath,
      repo: folderPath.split('/')[1] || '',
      owner: folderPath.split('/')[0] || '',
      url: '',
      tags: { course: '', shortCourse: '', type: '' },
      fullPath: folderPath
    };
    showTagModal = true;
  }

  function closeTagModal() {
    showTagModal = false;
    selectedFile = null;
    tagKey = '';
    tagValue = '';
  }

  function openClearTagsModal(file: FileEntry) {
    selectedFile = file;
    showClearTagsModal = true;
  }

  function openFolderClearTagsModal(folderPath: string) {
    selectedFile = {
      id: folderPath,
      filename: folderPath.split('/').pop() || folderPath,
      path: folderPath,
      repo: folderPath.split('/')[1] || '',
      owner: folderPath.split('/')[0] || '',
      url: '',
      tags: { course: '', shortCourse: '', type: '' },
      fullPath: folderPath
    };
    showClearTagsModal = true;
  }

  function closeClearTagsModal() {
    showClearTagsModal = false;
    selectedFile = null;
  }

  onMount(() => {
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
                <div class="flex flex-col flex-1">
                  <span class="font-medium text-foreground group-hover:text-foreground text-sm">{item.name}</span>
                  <span class="text-xs text-muted-foreground group-hover:text-foreground/70">{item.file?.repo} / {item.file?.owner}</span>
                  {#if item.file?.tags}
                    <div class="flex gap-1 mt-1 flex-wrap">
                      {#each Object.entries(item.file.tags) as [key, value]}
                        {#if value && value.trim() !== ''}
                          <span class="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md">
                            {key}: {value}
                          </span>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
                <!-- meatballs menu -->
                <div class="ml-auto">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      {#snippet child({ props })}
                        <Button 
                          {...props}
                          variant="outline"
                          size="sm"
                          class="h-8 w-8 p-0"
                          aria-label="More options"
                        >
                          <IconDots size={16} />
                        </Button>
                      {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content class="w-48" align="end">
                      <DropdownMenu.Item onclick={() => openTagModal(item.file!)}>
                        <IconTag size={16} class="mr-2" />
                        Add Tag
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onclick={() => openClearTagsModal(item.file!)}>
                        <IconTrash size={16} class="mr-2" />
                        Clear Tags
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>
            </CardContent>
          </Card>
        {:else}
          <Card class="group p-0 bg-card border border-muted rounded-lg shadow-none transition-colors">
            <CardContent class="p-0">
              <div class="flex items-center gap-3 px-4 py-3">
                <IconFolder size={18} class="text-muted-foreground group-hover:text-foreground transition-colors" />
                <button 
                  class="flex flex-col flex-1 text-left"
                  on:click={() => navigateToDirectory(item.name)}
                >
                  <span class="font-medium text-foreground group-hover:text-foreground text-sm">{item.name}</span>
                </button>
                <!-- meatballs menu for folder -->
                <div class="ml-auto">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      {#snippet child({ props })}
                        <Button 
                          {...props}
                          variant="outline"
                          size="sm"
                          class="h-8 w-8 p-0"
                          aria-label="More options"
                          onclick={(e) => e.stopPropagation()}
                        >
                          <IconDots size={16} />
                        </Button>
                      {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content class="w-48" align="end">
                      <DropdownMenu.Item onclick={() => {
                        const folderPath = currentPath === '' ? item.name : currentPath + '/' + item.name;
                        openFolderTagModal(folderPath);
                      }}>
                        <IconTag size={16} class="mr-2" />
                        Add Tag
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onclick={() => {
                        const folderPath = currentPath === '' ? item.name : currentPath + '/' + item.name;
                        openFolderClearTagsModal(folderPath);
                      }}>
                        <IconTrash size={16} class="mr-2" />
                        Clear Tags
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>
            </CardContent>
          </Card>
        {/if}
      {/each}
    </div>
  </div>
</main>

<!-- add tag dialog -->
<Dialog.Root bind:open={showTagModal}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>
          {#if selectedFile?.url === ''}
            Add Tag to All Files in "{selectedFile?.filename}"
          {:else}
            Add Tag to "{selectedFile?.filename}"
          {/if}
        </Dialog.Title>
      </Dialog.Header>
      <form 
        method="POST" 
        action="?/updateTag"
        use:enhance={({ formData }) => {
          console.log('Form submitting with data:', Object.fromEntries(formData));
          return async ({ result }) => {
            console.log('Form result:', result);
            if (result.type === 'success') {
              console.log('Success! Updating local data...');
              
              if (result.data?.updatedDocs) {
                const updatedDocs = result.data.updatedDocs as FileEntry[];
                console.log('Updated docs for folder:', updatedDocs);
                
                updatedDocs.forEach(updatedDoc => {
                  const fileIndex = files.findIndex(f => f.id === updatedDoc.id);
                  if (fileIndex !== -1) {
                    files[fileIndex] = { ...files[fileIndex], tags: updatedDoc.tags };
                  }
                });
                
                files = files;
                console.log(`Updated ${updatedDocs.length} files in folder`);
              } else if (result.data?.updatedDoc) {
                const updatedDoc = result.data.updatedDoc as FileEntry;
                console.log('Updated doc:', updatedDoc);
                
                const fileIndex = files.findIndex(f => f.id === selectedFile!.id);
                if (fileIndex !== -1) {
                  files[fileIndex] = { ...files[fileIndex], tags: updatedDoc.tags };
                  files = files;
                  console.log('Updated files array');
                }
              }
              
              closeTagModal();
            } else if (result.type === 'failure') {
              console.error('Form submission failed:', result.data);
            } else {
              console.log('Unexpected result type:', result.type);
            }
          };
        }}
      >
        <input type="hidden" name="id" value={selectedFile?.id || ''} />
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <label class="text-right text-sm font-medium" for="tag-key">Tag Key</label>
            <div class="col-span-3">
              <Select.Root type="single" onValueChange={(v: string) => { tagKey = v; }}>
                <Select.Trigger class="w-full">
                  {tagKey ? tagKeyOptions.find(opt => opt.value === tagKey)?.label || tagKey : 'Select tag key'}
                </Select.Trigger>
                <Select.Content>
                  {#each tagKeyOptions as option}
                    <Select.Item value={option.value}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
              <input type="hidden" name="tagKey" value={tagKey} />
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <label class="text-right text-sm font-medium" for="tag-value">Tag Value</label>
            <Input 
              id="tag-value"
              name="tagValue"
              type="text"
              bind:value={tagValue}
              class="col-span-3 focus:outline-none focus:ring-0"
              placeholder="Enter tag value"
              required
            />
          </div>
        </div>
        <Dialog.Footer>
          <Button 
            type="button"
            variant="outline"
            onclick={closeTagModal}
            class="focus:outline-none focus:ring-0"
          >
            Cancel
          </Button>
          <Button type="submit" class="focus:outline-none focus:ring-0">
            Save Tag
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog.Content>
  </Dialog.Root>
  <!-- clear tags confirmation dialog -->
  <Dialog.Root bind:open={showClearTagsModal}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>
          {#if selectedFile?.url === ''}
            Clear Tags from All Files in "{selectedFile?.filename}"
          {:else}
            Clear Tags from "{selectedFile?.filename}"
          {/if}
        </Dialog.Title>
        <Dialog.Description>
          {#if selectedFile?.url === ''}
            This will remove all custom tags from every file in this folder. Default tags (course, shortCourse, type) will be reset to empty values.
          {:else}
            This will remove all custom tags from this file. Default tags (course, shortCourse, type) will be reset to empty values.
          {/if}
        </Dialog.Description>
      </Dialog.Header>
      <form 
        method="POST" 
        action="?/clearTags"
        use:enhance={({ formData }) => {
          console.log('Clear tags form submitting with data:', Object.fromEntries(formData));
          return async ({ result }) => {
            console.log('Clear tags form result:', result);
            if (result.type === 'success') {
              console.log('Success! Clearing local data...');
              
              if (result.data?.updatedDocs) {
                const updatedDocs = result.data.updatedDocs as FileEntry[];
                console.log('Cleared tags for folder:', updatedDocs);
                
                updatedDocs.forEach(updatedDoc => {
                  const fileIndex = files.findIndex(f => f.id === updatedDoc.id);
                  if (fileIndex !== -1) {
                    files[fileIndex] = { ...files[fileIndex], tags: updatedDoc.tags };
                  }
                });
                
                files = files;
                console.log(`Cleared tags from ${updatedDocs.length} files in folder`);
              } else if (result.data?.updatedDoc) {
                const updatedDoc = result.data.updatedDoc as FileEntry;
                console.log('Cleared tags from doc:', updatedDoc);
                
                const fileIndex = files.findIndex(f => f.id === selectedFile!.id);
                if (fileIndex !== -1) {
                  files[fileIndex] = { ...files[fileIndex], tags: updatedDoc.tags };
                  files = files;
                  console.log('Updated files array');
                }
              }
              
              closeClearTagsModal();
            } else if (result.type === 'failure') {
              console.error('Clear tags form submission failed:', result.data);
            } else {
              console.log('Unexpected result type:', result.type);
            }
          };
        }}
      >
        <input type="hidden" name="id" value={selectedFile?.id || ''} />
        <Dialog.Footer>
          <Button 
            type="button"
            variant="outline"
            onclick={closeClearTagsModal}
            class="focus:outline-none focus:ring-0"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="destructive"
            class="focus:outline-none focus:ring-0"
          >
            Clear Tags
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog.Content>
  </Dialog.Root>
