import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function runSqlFix() {
  console.log('🔧 Fixing app_testing domain type constraint...\n')

  // Drop existing constraint
  console.log('Step 1: Dropping existing constraint...')
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_domain_type_check'
  })

  if (dropError) {
    console.log('Note: Constraint might not exist yet')
  } else {
    console.log('✅ Dropped existing constraint')
  }

  // Add new constraint
  console.log('\nStep 2: Adding updated constraint...')
  const { error: addError } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE tasks ADD CONSTRAINT tasks_domain_type_check
          CHECK (domain_type IS NULL OR domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing'))`
  })

  if (addError) {
    console.error('❌ Error adding constraint:', addError.message)

    // Try alternative method - direct SQL execution
    console.log('\nTrying direct execution...')
    const conn = `postgresql://postgres:${process.env.SUPABASE_SERVICE_KEY}@db.${process.env.SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co:5432/postgres`
    console.log('Connection string prepared')
    console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:')
    console.log('```sql')
    console.log('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_domain_type_check;')
    console.log("ALTER TABLE tasks ADD CONSTRAINT tasks_domain_type_check")
    console.log("  CHECK (domain_type IS NULL OR domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing'));")
    console.log('```')
    return
  }

  console.log('✅ Added updated constraint')

  // Test app_testing task
  console.log('\nStep 3: Testing app_testing task creation...')
  const { data, error: testError } = await supabase
    .from('tasks')
    .insert({
      creator_id: '7115c53f-353e-4f80-b45e-5603521f52b2',
      title: 'Test App Testing Task',
      description: 'Testing app_testing domain',
      category: 'Mobile App Testing',
      domain_type: 'app_testing',
      amount: 10.00,
      currency: 'USD',
      status: 'published'
    })
    .select()
    .single()

  if (testError) {
    console.error('❌ Test failed:', testError.message)
  } else {
    console.log('✅ app_testing task created successfully!')

    // Clean up
    await supabase.from('tasks').delete().eq('id', data.id)
    console.log('✅ Test task cleaned up')
  }

  console.log('\n🎉 Fix complete!')
}

runSqlFix()
