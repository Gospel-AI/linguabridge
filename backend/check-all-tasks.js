import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkAllTasks() {
  // Get all tasks from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`\n📊 Found ${data.length} tasks created today:\n`)

  const byDomain = {
    translation: 0,
    ai_verification: 0,
    physical_data: 0,
    app_testing: 0,
    generic: 0
  }

  data.forEach(task => {
    const domain = task.domain_type || 'generic'
    byDomain[domain] = (byDomain[domain] || 0) + 1
  })

  console.log('By Domain Type:')
  Object.entries(byDomain).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count}`)
  })

  console.log('\n📝 Recent tasks by domain:\n')

  const domains = ['translation', 'ai_verification', 'physical_data', 'app_testing', 'generic']
  domains.forEach(domain => {
    const tasks = data.filter(t => (t.domain_type || 'generic') === domain).slice(0, 3)
    if (tasks.length > 0) {
      console.log(`\n[${domain.toUpperCase()}]:`)
      tasks.forEach(task => {
        console.log(`  - ${task.title} ($${task.amount})`)
      })
    }
  })

  // Test app_testing task creation
  console.log('\n\n🧪 Testing app_testing task creation directly...\n')

  const testTask = {
    creator_id: '7115c53f-353e-4f80-b45e-5603521f52b2',
    title: 'Test App Testing Task',
    description: 'Testing app_testing domain task creation',
    category: 'Mobile App Testing',
    domain_type: 'app_testing',
    amount: 10.00,
    currency: 'USD',
    status: 'published'
  }

  const { data: newTask, error: createError } = await supabase
    .from('tasks')
    .insert(testTask)
    .select()
    .single()

  if (createError) {
    console.error('❌ app_testing task creation failed:')
    console.error('   Error:', createError.message)
    console.error('   Code:', createError.code)
    console.error('   Details:', createError.details)
  } else {
    console.log('✅ app_testing task created successfully!')
    console.log(`   ID: ${newTask.id}`)

    // Clean up test task
    await supabase.from('tasks').delete().eq('id', newTask.id)
    console.log('   (Test task deleted)')
  }
}

checkAllTasks()
