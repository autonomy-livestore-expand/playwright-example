# Playwright Persistent Context for Asset Caching

A state-of-the-art TypeScript/ESM example demonstrating how to use Playwright's persistent context feature to cache large assets (like `.db` files) for web agents.

## 🚀 Features

- **Persistent Context Management**: Create and reuse browser contexts with cached assets
- **Asset Caching**: Automatically cache large files (.db, .wasm, etc.)
- **Context Copying**: Copy base contexts to isolated session contexts
- **Performance Monitoring**: Track context sizes and load times
- **TypeScript + ESM**: Modern TypeScript with ES modules
- **Web Agent Ready**: Perfect for AI agents that need to revisit pages with large assets

## 📋 Use Cases

Perfect for:
- Web agents that need to visit pages with large database files
- Applications that repeatedly load the same heavy assets
- Performance testing with cached vs uncached loads
- Browser automation where asset caching is crucial

## 🛠️ Installation

```bash
npm install
```

## 📖 Usage

### Step 1: Initialize Base Context

First, create a base context and cache all assets:

```bash
# Using built version
npm run init

# Or for development
npm run dev:init
```

This will:
- Launch a browser with persistent context
- Navigate to the target URL (SQL.js demo by default)
- Cache all assets including large .wasm and .db files
- Save the context to `./contexts/base-context`

### Step 2: Copy and Use Context

Copy the base context to a new session and use it:

```bash
# Using built version
npm run copy-and-run

# Or for development
npm run dev:copy-and-run
```

This will:
- Copy the base context to a new session-specific folder
- Launch a browser using the copied context
- Navigate to the same URL with instant asset loading
- Demonstrate the performance improvement

## 🏗️ Architecture

### Core Components

- **`PersistentContextManager`**: Main class for managing contexts
- **`init.ts`**: Script to create and initialize base contexts
- **`copy-and-run.ts`**: Script to copy contexts and demonstrate usage
- **`index.ts`**: Library exports and example usage

### File Structure

```
src/
├── context-manager.ts    # Core context management logic
├── init.ts              # Context initialization script
├── copy-and-run.ts      # Context copying and usage script
└── index.ts             # Library exports and examples

contexts/
├── base-context/        # Base context with cached assets
└── session-*/          # Session-specific context copies

screenshots/            # Screenshots from test runs
```

## 🔧 API Reference

### PersistentContextManager

```typescript
import { PersistentContextManager } from './context-manager.js';

const manager = new PersistentContextManager();

// Initialize browser
await manager.initialize();

// Create base context with asset caching
await manager.createBaseContext('./contexts/base', 'https://example.com');

// Copy context for isolated sessions
await manager.copyContext('./contexts/base', './contexts/session-1');

// Use existing context with cached assets
const context = await manager.useExistingContext('./contexts/session-1');

// Cleanup
await manager.cleanup();
```

### Key Methods

- `createBaseContext(path, url)`: Create context and cache assets
- `copyContext(source, target)`: Copy context to new location
- `useExistingContext(path, url?)`: Use existing context
- `getContextSize(path)`: Get context size in bytes
- `formatBytes(bytes)`: Format bytes to human-readable string

## ⚡ Performance Benefits

When using cached contexts:

- **Asset Loading**: Large files load instantly from cache
- **Network Requests**: Reduced bandwidth usage
- **Load Times**: Significantly faster page loads
- **State Preservation**: Cookies, localStorage, and other state preserved

## 🎯 Example: Web Agent Usage

```typescript
import { PersistentContextManager } from './context-manager.js';

class WebAgent {
  private manager = new PersistentContextManager();
  
  async initialize() {
    await this.manager.initialize();
    
    // Create base context once
    await this.manager.createBaseContext(
      './contexts/agent-base', 
      'https://app-with-large-db.com'
    );
  }
  
  async createSession(sessionId: string) {
    const sessionPath = `./contexts/agent-${sessionId}`;
    
    // Copy context for this session
    await this.manager.copyContext('./contexts/agent-base', sessionPath);
    
    // Use context with cached assets
    return await this.manager.useExistingContext(sessionPath);
  }
}
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode (no build required)
npm run dev:init
npm run dev:copy-and-run
```

## 📊 Context Size Monitoring

The manager automatically tracks context sizes:

```typescript
const size = await manager.getContextSize('./contexts/base');
console.log(`Context size: ${manager.formatBytes(size)}`);
```

## 🔍 Troubleshooting

### Base context not found
Run `npm run init` first to create the base context.

### Large context sizes
This is expected when caching large assets. Monitor with `getContextSize()`.

### Permission errors
Ensure write permissions for the `contexts/` directory.
