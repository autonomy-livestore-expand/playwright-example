import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { chromium, BrowserContext, Browser } from 'playwright';

export interface ContextConfig {
  baseContextPath: string;
  targetContextPath: string;
  url: string;
  waitForAssets?: boolean;
  assetsTimeout?: number;
}

export class PersistentContextManager {
  private browser: Browser | null = null;
  
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false, // Set to true for production
    });
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async createBaseContext(contextPath: string, url: string): Promise<void> {
    // Ensure context directory exists
    await this.ensureDirectory(contextPath);

    // Close existing browser and use launchPersistentContext instead
    if (this.browser) {
      await this.browser.close();
    }

    // Create persistent context directly
    const context = await chromium.launchPersistentContext(contextPath, {
      headless: false, // Set to true for production
    });

    try {
      const page = await context.newPage();
      
      console.log(`🌐 Navigating to ${url}...`);
      await page.goto(url, {
        waitUntil: 'networkidle', // Wait for network to be idle
        timeout: 60000
      });

      // Wait for any large assets to be cached
      console.log('⏳ Waiting for assets to be cached...');
      await page.waitForTimeout(5000); // Give time for background downloads

      // Optional: Wait for specific assets if needed
      try {
        await page.waitForResponse(
          response => response.url().includes('.db') || 
                     response.url().includes('.wasm') ||
                     response.url().includes('.js') && response.url().includes('sql'), // SQL.js files
          { timeout: 30000 }
        );
        console.log('📦 Large assets detected and cached');
      } catch (error) {
        console.log('⚠️  No large assets detected within timeout');
      }

      console.log('✅ Base context created and assets cached');
      
    } finally {
      await context.close();
      // Re-initialize browser for other operations
      this.browser = await chromium.launch({
        headless: false,
      });
    }
  }

  async copyContext(sourceContextPath: string, targetContextPath: string): Promise<void> {
    console.log(`📁 Copying context from ${sourceContextPath} to ${targetContextPath}...`);
    
    // Remove target if it exists
    try {
      await fs.rm(targetContextPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    // Create target directory
    await this.ensureDirectory(targetContextPath);

    // Copy all contents from source to target
    await this.copyDirectory(sourceContextPath, targetContextPath);
    
    console.log('✅ Context copied successfully');
  }

  async useExistingContext(contextPath: string, url?: string): Promise<BrowserContext> {
    console.log(`🔄 Using existing context from ${contextPath}...`);
    
    // Close existing browser and use launchPersistentContext
    if (this.browser) {
      await this.browser.close();
    }
    
    const context = await chromium.launchPersistentContext(contextPath, {
      headless: false, // Set to true for production
    });

    if (url) {
      const page = await context.newPage();
      console.log(`🌐 Navigating to ${url} with cached assets...`);
      
      const startTime = Date.now();
      await page.goto(url, {
        waitUntil: 'domcontentloaded', // Faster since assets are cached
        timeout: 30000
      });
      const loadTime = Date.now() - startTime;
      
      console.log(`⚡ Page loaded in ${loadTime}ms (using cached assets)`);
    }

    // Re-initialize browser for other operations
    this.browser = await chromium.launch({
      headless: false,
    });
    
    return context;
  }

  private async ensureDirectory(path: string): Promise<void> {
    const resolvedPath = resolve(path);
    try {
      await fs.access(resolvedPath);
    } catch {
      await fs.mkdir(resolvedPath, { recursive: true });
    }
  }

  private async copyDirectory(source: string, target: string): Promise<void> {
    const resolvedSource = resolve(source);
    const resolvedTarget = resolve(target);

    const entries = await fs.readdir(resolvedSource, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = join(resolvedSource, entry.name);
      const targetPath = join(resolvedTarget, entry.name);

      if (entry.isDirectory()) {
        await this.ensureDirectory(targetPath);
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  async getContextSize(contextPath: string): Promise<number> {
    try {
      return await this.getDirectorySize(resolve(contextPath));
    } catch (error) {
      return 0;
    }
  }

  private async getDirectorySize(path: string): Promise<number> {
    let size = 0;
    try {
      const entries = await fs.readdir(path, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(path, entry.name);
        if (entry.isDirectory()) {
          size += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors and return current size
    }
    
    return size;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}