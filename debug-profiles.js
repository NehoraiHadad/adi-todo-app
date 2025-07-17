#!/usr/bin/env node
/**
 * Debug script to query the profiles table and show all users
 * This helps debug login issues by showing the current state of user data
 * 
 * Usage: node debug-profiles.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('\nPlease check your .env.local file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfiles() {
  console.log('🔍 Debugging Profiles Table');
  console.log('=' .repeat(50));
  
  try {
    // Query profiles table
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying profiles:', error);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found in the database');
      return;
    }

    console.log(`📊 Found ${profiles.length} profile(s):`);
    console.log('');

    // Display profiles in a formatted way
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Profile ID: ${profile.id}`);
      console.log(`   Username: ${profile.username || 'N/A'}`);
      console.log(`   Display Name: ${profile.display_name || 'N/A'}`);
      console.log(`   Email: ${profile.email || 'N/A'}`);
      console.log(`   Role: ${profile.role || 'N/A'}`);
      console.log(`   Created: ${profile.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}`);
      console.log(`   Updated: ${profile.updated_at ? new Date(profile.updated_at).toLocaleString() : 'N/A'}`);
      console.log('   ' + '-'.repeat(40));
    });

    // Additional debugging info
    console.log('\n📋 Summary:');
    console.log(`   Total profiles: ${profiles.length}`);
    
    const usernameCount = profiles.filter(p => p.username).length;
    const displayNameCount = profiles.filter(p => p.display_name).length;
    const emailCount = profiles.filter(p => p.email).length;
    
    console.log(`   Profiles with username: ${usernameCount}`);
    console.log(`   Profiles with display_name: ${displayNameCount}`);
    console.log(`   Profiles with email: ${emailCount}`);
    
    // Check for potential issues
    console.log('\n⚠️  Potential Issues:');
    
    const duplicateUsernames = profiles
      .filter(p => p.username)
      .reduce((acc, profile) => {
        acc[profile.username] = (acc[profile.username] || 0) + 1;
        return acc;
      }, {});
    
    const duplicates = Object.entries(duplicateUsernames)
      .filter(([username, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('   ❌ Duplicate usernames found:');
      duplicates.forEach(([username, count]) => {
        console.log(`      - "${username}" appears ${count} times`);
      });
    } else {
      console.log('   ✅ No duplicate usernames found');
    }
    
    const profilesWithoutUsername = profiles.filter(p => !p.username);
    if (profilesWithoutUsername.length > 0) {
      console.log(`   ⚠️  ${profilesWithoutUsername.length} profile(s) without username`);
    } else {
      console.log('   ✅ All profiles have usernames');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Also query user_roles table for additional context
async function debugUserRoles() {
  console.log('\n🔍 Debugging User Roles Table');
  console.log('=' .repeat(50));
  
  try {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying user_roles:', error);
      return;
    }

    if (!roles || roles.length === 0) {
      console.log('⚠️  No user roles found in the database');
      return;
    }

    console.log(`📊 Found ${roles.length} user role(s):`);
    console.log('');

    roles.forEach((role, index) => {
      console.log(`${index + 1}. User ID: ${role.user_id}`);
      console.log(`   Role: ${role.role}`);
      console.log(`   Created: ${role.created_at ? new Date(role.created_at).toLocaleString() : 'N/A'}`);
      console.log('   ' + '-'.repeat(40));
    });

    // Summary
    const roleTypes = roles.reduce((acc, role) => {
      acc[role.role] = (acc[role.role] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📋 Role Distribution:');
    Object.entries(roleTypes).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} user(s)`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug functions
async function main() {
  console.log('🚀 Starting Profile Debug Script');
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using API Key: ${supabaseKey.substring(0, 10)}...`);
  console.log('');

  await debugProfiles();
  await debugUserRoles();
  
  console.log('\n✅ Debug script completed');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
main().catch(console.error);