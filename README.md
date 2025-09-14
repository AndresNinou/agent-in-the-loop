# VS Code Extension Testing Framework

Automated testing framework for VS Code extensions with persistent login states.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Initial setup (download VS Code, ChromeDriver, extensions)
npm run ui:prep

# 3. Set up logins (one-time, 5-minute process)
npm run ui:setup
# Log into your accounts when VS Code opens

# 4. Run tests with persistence
npm run ui:test
```

## 📁 Core Components

```
controller_vscode/
├── lib/
│   ├── injectPersistence.sh    # Maintains login persistence
│   ├── openAttach.js           # Opens extensions (command/tab/sidebar)
│   └── chatDriver.js           # Automates chat interactions
├── selectors/
│   └── cline.json              # Extension selectors config
├── ui-tests/
│   ├── cline.chat.test.js      # Cline extension test
│   ├── check-persistence.test.js # Verify logins persist
│   └── manual-verify-persistence.test.js # Manual setup
└── run-with-persistence.sh      # Main test runner
```

## 🔧 How It Works

The **persistence injector** (`lib/injectPersistence.sh`):
- Runs in background during tests
- Monitors `state.vscdb` (contains login tokens)
- Restores it instantly when ExTester clears it
- Result: Your logins persist across all test runs!

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm run ui:prep` | Download VS Code, ChromeDriver, extensions |
| `npm run ui:setup` | One-time login setup |
| `npm run ui:test` | Run all tests with persistence |
| `npm run ui:test:cline` | Test Cline extension |

