#!/usr/bin/env node

import { resolve } from 'path';
import { PersistentContextManager } from './context-manager.js';

async function main() {
  // Configuration - you can modify these values
  const BASE_CONTEXT_PATH = resolve('./contexts/base-context');
  const TARGET_URL = 'https://sql.js.org/examples/GUI/'; // Example site with large .wasm/.db files
  
  console.log('🚀 Initializing Playwright Persistent Context');
  console.log(`📍 Target URL: ${TARGET_URL}`);
  console.log(`📁 Context Path: ${BASE_CONTEXT_PATH}`);
  console.log('');

  const manager = new PersistentContextManager();

  try {
    // Initialize browser
    await manager.initialize();
    
    // Create base context and cache assets
    console.log('📦 Creating base context and caching assets...');
    await manager.createBaseContext(BASE_CONTEXT_PATH, TARGET_URL);
    
    // Check the size of cached data
    const contextSize = await manager.getContextSize(BASE_CONTEXT_PATH);
    console.log(`💾 Context size: ${manager.formatBytes(contextSize)}`);
    console.log('');
    console.log('✅ Initialization complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run `npm run copy-and-run` to copy context and test performance');
    console.log('2. Or run `npm run dev:copy-and-run` for development mode');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Playwright Persistent Context Initializer

Usage: npm run init

This script will:
1. Launch a browser with persistent context
2. Navigate to a target URL (default: SQL.js demo with large assets)
3. Cache all assets including large .db and .wasm files
4. Save the context for later reuse

Options:
  --help, -h    Show this help message

Example:
  npm run init
  npm run dev:init
`);
  process.exit(0);
}

main().catch(console.error);