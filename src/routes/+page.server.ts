import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import fs from 'fs-extra';
import path from 'path';

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
    [key: string]: string;
  };
};

export const load: PageServerLoad = async () => {
  const DATA_DIR = path.resolve('data');
  const files = await fs.readdir(DATA_DIR);
  const docs: FileEntry[] = [];
  for (const f of files.filter((f) => f.endsWith('.json'))) {
    docs.push(...(await fs.readJSON(path.join(DATA_DIR, f))));
  }
  return { docs };
};

export const actions: Actions = {
  updateTag: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const tagKey = formData.get('tagKey') as string;
    const tagValue = formData.get('tagValue') as string;
    
    console.log('Form data received:', { id, tagKey, tagValue });
    
    if (!id || !tagKey) {
      console.log('Invalid data - missing id or tagKey');
      return fail(400, { message: 'Invalid data' });
    }

    const isFolderTag = !id.includes('.pdf') && !id.includes('.doc') && !id.includes('.txt') && 
                       !id.includes('.jpg') && !id.includes('.png') && !id.includes('.zip');
    
    console.log('Is folder tag operation:', isFolderTag, 'for path:', id);
    
    if (isFolderTag) {
      try {
        const DATA_DIR = path.resolve('data');
        const files = await fs.readdir(DATA_DIR);
        const allDocs: FileEntry[] = [];
        const updatedFiles: string[] = [];
        
        for (const f of files.filter((f) => f.endsWith('.json'))) {
          const filePath = path.join(DATA_DIR, f);
          const docs: FileEntry[] = await fs.readJSON(filePath);
          
          console.log(`Processing file: ${f}, found ${docs.length} documents`);
          
          let fileUpdated = false;
          docs.forEach((doc, idx) => {
            const filePathSegments = doc.id.split('/');
            const folderPathSegments = id.split('/');
            
            let isInFolder = false;
            if (folderPathSegments.length >= 2) {
              if (filePathSegments.length > folderPathSegments.length) {
                const filePathPrefix = filePathSegments.slice(0, folderPathSegments.length).join('/');
                isInFolder = filePathPrefix === id;
              }
            }
            
            console.log(`Checking file: ${doc.id}, folder: ${id}, isInFolder: ${isInFolder}`);
            
            if (isInFolder) {
              if (!docs[idx].tags) {
                docs[idx].tags = { course: '', shortCourse: '', type: '' };
              }
              docs[idx].tags[tagKey] = tagValue;
              fileUpdated = true;
              allDocs.push(docs[idx]);
              console.log(`Updated file: ${doc.id}`);
            }
          });
          
          if (fileUpdated) {
            await fs.writeJSON(filePath, docs, { spaces: 2 });
            updatedFiles.push(f);
          }
        }
        
        console.log(`Updated ${allDocs.length} files in ${updatedFiles.length} JSON files`);
        
        return { 
          success: true, 
          updatedDocs: allDocs,
          folderPath: id,
          message: `Tag added to ${allDocs.length} files in folder`
        };
      } catch (error) {
        console.error('Error updating folder tags:', error);
        return fail(500, { message: 'Failed to update folder tags' });
      }
    } else {
      const [owner, repo] = id.split('/', 2);
      console.log('Parsed owner/repo:', { owner, repo });
      
      const filePath = path.resolve('data', `${owner}.${repo}.json`);
      console.log('File path:', filePath);
      
      try {
        const docs: FileEntry[] = await fs.readJSON(filePath);
        console.log('Loaded docs, count:', docs.length);
        
        const idx = docs.findIndex((d: FileEntry) => d.id === id);
        console.log('Found index:', idx);
        
        if (idx === -1) {
          console.log('Document not found with id:', id);
          return fail(404, { message: 'Document not found' });
        }

        if (!docs[idx].tags) {
          docs[idx].tags = { course: '', shortCourse: '', type: '' };
        }
        
        docs[idx].tags[tagKey] = tagValue;
        console.log('Updated document tags:', docs[idx].tags);
        
        await fs.writeJSON(filePath, docs, { spaces: 2 });
        console.log('File written successfully');
        
        return { 
          success: true, 
          updatedDoc: docs[idx],
          message: 'Tag added successfully'
        };
      } catch (error) {
        console.error('Error updating tag:', error);
        return fail(500, { message: 'Failed to update tag' });
      }
    }
  },
  
  clearTags: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    
    console.log('Clear tags request received for:', id);
    
    if (!id) {
      console.log('Invalid data - missing id');
      return fail(400, { message: 'Invalid data' });
    }

    const isFolderTag = !id.includes('.pdf') && !id.includes('.doc') && !id.includes('.txt') && 
                       !id.includes('.jpg') && !id.includes('.png') && !id.includes('.zip');
    
    console.log('Is folder clear tags operation:', isFolderTag, 'for path:', id);
    
    if (isFolderTag) {
      try {
        const DATA_DIR = path.resolve('data');
        const files = await fs.readdir(DATA_DIR);
        const allDocs: FileEntry[] = [];
        const updatedFiles: string[] = [];
        
        for (const f of files.filter((f) => f.endsWith('.json'))) {
          const filePath = path.join(DATA_DIR, f);
          const docs: FileEntry[] = await fs.readJSON(filePath);
          
          console.log(`Processing file: ${f}, found ${docs.length} documents`);
          
          let fileUpdated = false;
          docs.forEach((doc, idx) => {
            const filePathSegments = doc.id.split('/');
            const folderPathSegments = id.split('/');
            
            let isInFolder = false;
            if (folderPathSegments.length >= 2) {
              if (filePathSegments.length > folderPathSegments.length) {
                const filePathPrefix = filePathSegments.slice(0, folderPathSegments.length).join('/');
                isInFolder = filePathPrefix === id;
              }
            }
            
            console.log(`Checking file: ${doc.id}, folder: ${id}, isInFolder: ${isInFolder}`);
            
            if (isInFolder) {
              docs[idx].tags = { course: '', shortCourse: '', type: '' };
              fileUpdated = true;
              allDocs.push(docs[idx]);
              console.log(`Cleared tags from file: ${doc.id}`);
            }
          });
          
          if (fileUpdated) {
            await fs.writeJSON(filePath, docs, { spaces: 2 });
            updatedFiles.push(f);
          }
        }
        
        console.log(`Cleared tags from ${allDocs.length} files in ${updatedFiles.length} JSON files`);
        
        return { 
          success: true, 
          updatedDocs: allDocs,
          folderPath: id,
          message: `Tags cleared from ${allDocs.length} files in folder`
        };
      } catch (error) {
        console.error('Error clearing folder tags:', error);
        return fail(500, { message: 'Failed to clear folder tags' });
      }
    } else {
      const [owner, repo] = id.split('/', 2);
      console.log('Parsed owner/repo:', { owner, repo });
      
      const filePath = path.resolve('data', `${owner}.${repo}.json`);
      console.log('File path:', filePath);
      
      try {
        const docs: FileEntry[] = await fs.readJSON(filePath);
        console.log('Loaded docs, count:', docs.length);
        
        const idx = docs.findIndex((d: FileEntry) => d.id === id);
        console.log('Found index:', idx);
        
        if (idx === -1) {
          console.log('Document not found with id:', id);
          return fail(404, { message: 'Document not found' });
        }

        docs[idx].tags = { course: '', shortCourse: '', type: '' };
        console.log('Cleared document tags:', docs[idx].tags);
        
        await fs.writeJSON(filePath, docs, { spaces: 2 });
        console.log('File written successfully');
        
        return { 
          success: true, 
          updatedDoc: docs[idx],
          message: 'Tags cleared successfully'
        };
      } catch (error) {
        console.error('Error clearing tags:', error);
        return fail(500, { message: 'Failed to clear tags' });
      }
    }
  }
};
