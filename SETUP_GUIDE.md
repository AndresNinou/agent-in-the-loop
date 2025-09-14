# 🚀 Reliable Cline CLI Setup & Troubleshooting Guide

## 🎯 **Complete Setup Workflow**

### **Step 1: Initial Setup (One Time)**
```bash
# 1. Install dependencies and prepare VS Code
npm run ui:prep

# 2. Create initial login session (CRITICAL STEP)
npm run setup:login
```

### **Step 2: Login Setup**
```bash
# This opens VS Code for 5 minutes - you MUST:
# 1. Sign in to GitHub/Microsoft accounts
# 2. Install any needed extensions manually
# 3. Configure settings as needed
# 4. Wait for the 5 minutes to complete (don't Ctrl+C early!)

npm run setup:login
```

### **Step 3: Verify Setup**
```bash
# Test that login persistence works
npm run setup:verify
```

### **Step 4: Start Using CLI**
```bash
# Single message
npm run cli "Your message here"

# Multiple messages
npm run cli:multi "Message 1" "Message 2" "Message 3"

# Interactive mode
npm run cli:interactive
```

## 🔧 **Troubleshooting Common Issues**

### **Issue: "State file missing or too small"**
**Cause:** VS Code startup race condition with persistence system

**Solution:**
```bash
# Stop all VS Code processes
pkill -f "VSCode-linux-x64" || true

# Clean and rebuild persistence
rm -rf vscode-test-persistent/settings/User/globalStorage/state.vscdb*
npm run setup:clean
npm run setup:login
```

### **Issue: "Unable to locate element .monaco-workbench"**
**Cause:** VS Code not fully loaded before Cline attachment

**Solution:** The improved system now includes:
- Extended VS Code startup wait times
- UI stability verification
- Authentication state checking
- Better error handling

### **Issue: Authentication not preserved**
**Cause:** Incomplete login session or corrupted state file

**Solution:**
```bash
# Complete fresh setup
npm run setup:fresh
```

### **Issue: Cline extension not found**
**Cause:** Extension not installed or not activated

**Solution:**
```bash
# Reinstall Cline extension
npm run ui:prep
# Then do fresh login setup
npm run setup:login
```

## 📋 **Reliable Testing Workflow**

### **Daily Use Pattern:**
```bash
# 1. Quick verification (optional)
npm run setup:check

# 2. Use CLI normally
npm run cli "Your task here"

# 3. If issues occur, run diagnostics
npm run debug:state
```

### **Weekly Maintenance:**
```bash
# Clean up old state and refresh
npm run setup:refresh
```

## 🚨 **Emergency Recovery**

If nothing works:
```bash
# Nuclear option - complete clean slate
npm run setup:nuclear
```

## 📊 **Success Indicators**

✅ **Setup Complete When:**
- No "State file missing" messages during startup
- VS Code opens without sign-in prompts  
- Cline extension loads without errors
- CLI messages work on first try

❌ **Setup Failed When:**
- Continuous state file restoration messages
- Sign-in prompts every time
- "monaco-workbench" not found errors
- CLI session creation failures

## 🔍 **Debug Information**

### **Check State File Size:**
```bash
ls -la vscode-test-persistent/settings/User/globalStorage/state.vscdb*
```
Should be > 1MB for valid login state

### **Check VS Code Processes:**
```bash
ps aux | grep -E "(chrome|vscode|VSCode)" | grep -v grep
```

### **View Recent Logs:**
```bash
tail -n 50 vscode-test-persistent/test.log
```

## 📁 **Important Files**

- `state.vscdb` - Main persistence file (should be ~1.5MB when logged in)
- `state.vscdb.backup` - Backup of working state
- `test.log` - VS Code test execution logs
- `debug-*.html` - Debug snapshots when errors occur
