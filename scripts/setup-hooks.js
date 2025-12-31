#!/usr/bin/env node

/**
 * Setup script for c0ntextKeeper hooks
 * Configures Claude Code to use the preCompact hook
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 c0ntextKeeper Hook Setup');
console.log('============================\n');

// Check if running as part of npm install (skip interactive setup)
const isNpmInstall = process.env.npm_lifecycle_event === 'preinstall' || 
                     process.env.npm_lifecycle_event === 'postinstall';

if (isNpmInstall) {
  console.log('📦 Running as part of npm install - skipping interactive setup');
  console.log('Run "npx c0ntextkeeper setup" after installation to configure hooks\n');
  process.exit(0);
}

async function setupHooks() {
  try {
    console.log('📋 Setting up c0ntextKeeper hooks for Claude Code...\n');

    // Get the installed package path
    const packagePath = path.dirname(__dirname);
    const hookScript = path.join(packagePath, 'dist', 'hooks', 'precompact.js');

    // Check if the built hook exists
    if (!fs.existsSync(hookScript)) {
      console.error('❌ Error: Hook script not found. Please run "npm run build" first.');
      process.exit(1);
    }

    // Create the hook configuration
    const hookConfig = {
      matcher: '*',
      hooks: [{
        type: 'command',
        command: `node ${hookScript}`
      }]
    };

    console.log('📝 Hook configuration:');
    console.log(JSON.stringify(hookConfig, null, 2));
    console.log();

    // Try to configure using Claude CLI
    try {
      console.log('🔧 Attempting to configure hook via Claude CLI...');
      
      const currentSettings = execSync('claude settings get hooks.PreCompact 2>/dev/null', {
        encoding: 'utf-8'
      }).trim();

      let hooks = [];
      if (currentSettings && currentSettings !== 'null') {
        try {
          hooks = JSON.parse(currentSettings);
        } catch (e) {
          console.warn('⚠️  Could not parse existing hooks, starting fresh');
        }
      }

      // Add our hook if not already present
      const existingHook = hooks.find(h => 
        h.hooks && h.hooks.some(hk => hk.command && hk.command.includes('c0ntextkeeper'))
      );

      if (!existingHook) {
        hooks.push(hookConfig);
        
        const hookJson = JSON.stringify(hooks).replace(/"/g, '\\"');
        execSync(`claude settings set hooks.PreCompact "${hookJson}"`, {
          encoding: 'utf-8'
        });
        
        console.log('✅ Hook configured successfully via Claude CLI');
      } else {
        console.log('ℹ️  c0ntextKeeper hook already configured');
      }
    } catch (error) {
      console.log('\n⚠️  Could not configure automatically via Claude CLI');
      console.log('Please add the following to your Claude Code settings:\n');
      console.log('1. Run: claude settings edit');
      console.log('2. Add under hooks.PreCompact:');
      console.log(JSON.stringify([hookConfig], null, 2));
    }

    // Create hooks directory for manual installation
    const hooksDir = path.join(process.env.HOME, '.claude', 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
      console.log(`\n📁 Created hooks directory: ${hooksDir}`);
    }

    // Copy hook script for manual use
    const manualHookPath = path.join(hooksDir, 'c0ntextkeeper-hook.js');
    const hookContent = `#!/usr/bin/env node
// c0ntextKeeper PreCompact Hook
require('${hookScript}');
`;
    
    fs.writeFileSync(manualHookPath, hookContent);
    fs.chmodSync(manualHookPath, '755');
    
    console.log(`📄 Manual hook script created: ${manualHookPath}`);

    console.log('\n✨ Setup complete!');
    console.log('\n📖 Next steps:');
    console.log('1. Start Claude Code in any project');
    console.log('2. Work normally and make changes');
    console.log('3. Run /compact to trigger context preservation');
    console.log('4. Check ~/.c0ntextkeeper/archive/ for preserved context');
    console.log('\n💡 Use MCP tools to retrieve context:');
    console.log('- fetch_context - Get relevant archived context');
    console.log('- search_archive - Search through archives');
    console.log('- get_patterns - Find recurring patterns\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupHooks();
