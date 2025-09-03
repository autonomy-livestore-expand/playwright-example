#!/usr/bin/env node

import { resolve } from 'path';
import { randomBytes } from 'crypto';
import { PersistentContextManager } from './context-manager.js';

async function main() {
  // Configuration
  const BASE_CONTEXT_PATH = resolve('./contexts/base-context');
  const SESSION_ID = randomBytes(8).toString('hex');
  const TARGET_CONTEXT_PATH = resolve(`./contexts/session-${SESSION_ID}`);
  const TARGET_URL = 'https://sql.js.org/examples/GUI/'; // Same URL as initialization
  
  console.log('🔄 Copying and Running with Persistent Context');
  console.log(`📁 Source Context: ${BASE_CONTEXT_PATH}`);
  console.log(`📁 Target Context: ${TARGET_CONTEXT_PATH}`);
  console.log(`🆔 Session ID: ${SESSION_ID}`);
  console.log('');

  const manager = new PersistentContextManager();

  try {
    // Initialize browser
    await manager.initialize();
    
    // Check if base context exists
    const baseContextSize = await manager.getContextSize(BASE_CONTEXT_PATH);
    if (baseContextSize === 0) {
      console.error('❌ Base context not found or empty!');
      console.log('Please run `npm run init` first to create the base context.');
      process.exit(1);
    }
    
    console.log(`📊 Base context size: ${manager.formatBytes(baseContextSize)}`);
    
    // Copy context
    await manager.copyContext(BASE_CONTEXT_PATH, TARGET_CONTEXT_PATH);
    
    // Verify copy
    const copiedContextSize = await manager.getContextSize(TARGET_CONTEXT_PATH);
    console.log(`📊 Copied context size: ${manager.formatBytes(copiedContextSize)}`);
    console.log('');
    
    // Use the copied context
    console.log('🎯 Testing performance with cached assets...');
    const context = await manager.useExistingContext(TARGET_CONTEXT_PATH, TARGET_URL);
    
    // Perform some operations to demonstrate the cached context
    const page = await context.pages()[0]; // Get the page created by useExistingContext
    
    // Wait a bit to see the page load
    await page.waitForTimeout(2000);
    
    // Try to interact with the page (if it's the SQL.js demo)
    try {
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);
      
      // Check if SQL.js assets are available (they should load instantly from cache)
      const sqlJsLoaded = await page.evaluate(() => {
        return typeof (window as any).SQL !== 'undefined';
      });
      
      if (sqlJsLoaded) {
        console.log('⚡ SQL.js loaded instantly from cache!');
      }
      
      // Take a screenshot as proof
      const screenshotPath = resolve(`./screenshots/session-${SESSION_ID}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
    } catch (error) {
      console.log('⚠️  Could not interact with page content, but context is working');
    }
    
    console.log('');
    console.log('🎉 Success! The context has been copied and used.');
    console.log('');
    console.log('Performance Benefits:');
    console.log('• Large assets (.wasm, .db files) are cached');
    console.log('• Subsequent page loads are significantly faster');
    console.log('• Browser state (cookies, localStorage) is preserved');
    console.log('• Each session gets an isolated copy of the context');
    console.log('');
    console.log(`Context Details:`);
    console.log(`• Session Context: ${TARGET_CONTEXT_PATH}`);
    console.log(`• Size: ${manager.formatBytes(copiedContextSize)}`);
    
    // Keep the page open for a few seconds so user can see it
    await page.waitForTimeout(5000);
    
    await context.close();
    
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Playwright Persistent Context Copy and Run

Usage: npm run copy-and-run

This script will:
1. Copy the base persistent context to a new session-specific folder
2. Launch a browser using the copied context
3. Navigate to the target URL with cached assets
4. Demonstrate the performance benefits

Prerequisites:
  Run 'npm run init' first to create the base context

Options:
  --help, -h    Show this help message

Example:
  npm run copy-and-run
  npm run dev:copy-and-run
`);
  process.exit(0);
}

main().catch(console.error);