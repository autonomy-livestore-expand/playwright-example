#!/usr/bin/env node

export * from './context-manager.js';

// Example usage
import { resolve } from 'path';
import { PersistentContextManager } from './context-manager.js';

async function example() {
  const manager = new PersistentContextManager();
  
  try {
    await manager.initialize();
    
    const baseContextPath = resolve('./contexts/base-context');
    const sessionContextPath = resolve('./contexts/my-session');
    const url = 'https://sql.js.org/examples/GUI/';
    
    // Step 1: Create base context (do this once)
    console.log('Creating base context...');
    await manager.createBaseContext(baseContextPath, url);
    
    // Step 2: Copy context for each session
    console.log('Copying context for session...');
    await manager.copyContext(baseContextPath, sessionContextPath);
    
    // Step 3: Use the copied context
    console.log('Using copied context...');
    const context = await manager.useExistingContext(sessionContextPath, url);
    
    // Your web agent logic here...
    const page = await context.pages()[0];
    // ... perform actions with cached assets
    
    await context.close();
    
  } finally {
    await manager.cleanup();
  }
}

// Only run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  example().catch(console.error);
}