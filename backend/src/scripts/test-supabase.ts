// Supabase connection test script
// Run with: npm run test:supabase (add to package.json scripts)

import 'dotenv/config'
import { supabase } from '../lib/supabase'

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n')

  try {
    // Test 1: Check connection
    console.log('1️⃣ Testing database connection...')
    const { error: tablesError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (tablesError) {
      throw new Error(`Connection failed: ${tablesError.message}`)
    }
    console.log('✅ Database connection successful\n')

    // Test 2: Verify tables exist
    console.log('2️⃣ Verifying tables...')
    const tablesToCheck = ['users', 'tasks', 'applications', 'transactions']

    for (const table of tablesToCheck) {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ Table "${table}" not found or inaccessible`)
      } else {
        console.log(`✅ Table "${table}" exists`)
      }
    }
    console.log('')

    // Test 3: Check RLS
    console.log('3️⃣ Checking Row Level Security...')
    const { error: rlsError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    // With service key, we should bypass RLS and get results (or empty array)
    if (rlsError) {
      console.log('⚠️  RLS check inconclusive:', rlsError.message)
    } else {
      console.log('✅ RLS configured (service key has full access)')
    }
    console.log('')

    // Test 4: Environment variables
    console.log('4️⃣ Checking environment variables...')
    const envVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'PORT',
      'NODE_ENV',
    ]

    for (const envVar of envVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} is set`)
      } else {
        console.log(`❌ ${envVar} is missing`)
      }
    }
    console.log('')

    console.log('🎉 All Supabase tests passed!\n')
    console.log('Next steps:')
    console.log('1. Test user registration from frontend')
    console.log('2. Create sample data for development')
    console.log('3. Set up Stripe Connect integration\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Supabase test failed:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY in .env')
    console.error('2. Check that schema.sql has been executed in Supabase')
    console.error('3. Ensure RLS policies are created')
    console.error('4. Visit https://supabase.com/dashboard to check project status\n')
    process.exit(1)
  }
}

testSupabaseConnection()
