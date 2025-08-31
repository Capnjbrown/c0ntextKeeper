#!/usr/bin/env node

/**
 * Post-install script for c0ntextkeeper
 * Shows instructions for completing setup
 */

const isGlobalInstall = process.env.npm_config_global === 'true';
const isNpmInstall = process.env.npm_lifecycle_event === 'postinstall';

// Only show message for global installations
if (isNpmInstall && isGlobalInstall) {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║     🧠 c0ntextKeeper installed successfully!          ║');
  console.log('║                                                        ║');
  console.log('║     Complete setup by running:                        ║');
  console.log('║                                                        ║');
  console.log('║          c0ntextkeeper setup                          ║');
  console.log('║                                                        ║');
  console.log('║     This will configure hooks for automatic           ║');
  console.log('║     context preservation in Claude Code.              ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n');
}