// Sample data seeding script for development
// Run with: npm run seed

import 'dotenv/config'
import { supabase } from '../lib/supabase'

async function seedData() {
  console.log('🌱 Seeding sample data...\n')

  try {
    // 1. Create sample users
    console.log('1️⃣ Creating sample users...')

    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'client@example.com',
        role: 'client',
        full_name: 'John Client',
        bio: 'Looking for skilled workers for various tasks',
        onboarding_completed: true,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'worker@example.com',
        role: 'worker',
        full_name: 'Alice Worker',
        bio: 'Experienced in data entry and web research',
        onboarding_completed: true,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'both@example.com',
        role: 'both',
        full_name: 'Bob Freelancer',
        bio: 'Both client and worker on the platform',
        onboarding_completed: true,
      },
    ]

    const { data: createdUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select()

    if (usersError) {
      console.log('⚠️  Users may already exist:', usersError.message)
    } else {
      console.log(`✅ Created ${createdUsers.length} users`)
    }

    // 2. Create sample tasks
    console.log('\n2️⃣ Creating sample tasks...')

    const tasks = [
      {
        creator_id: '11111111-1111-1111-1111-111111111111',
        title: 'Data Entry - 100 Product Records',
        description: 'Need someone to enter 100 product details into our database from a CSV file. Should take approximately 2-3 hours.',
        category: 'Data Entry',
        amount: 25.00,
        status: 'published',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        requirements: {
          skills: ['Data Entry', 'Excel'],
          experience: 'Beginner',
          tools: ['Microsoft Excel or Google Sheets'],
        },
        published_at: new Date().toISOString(),
      },
      {
        creator_id: '11111111-1111-1111-1111-111111111111',
        title: 'Web Research - Competitor Analysis',
        description: 'Research 20 competitors and compile information about their pricing, features, and target market.',
        category: 'Research',
        amount: 50.00,
        status: 'published',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: {
          skills: ['Web Research', 'Analysis'],
          experience: 'Intermediate',
          tools: ['Internet Browser', 'Spreadsheet Software'],
        },
        published_at: new Date().toISOString(),
      },
      {
        creator_id: '33333333-3333-3333-3333-333333333333',
        title: 'Social Media Content Creation',
        description: 'Create 10 engaging social media posts for our product launch.',
        category: 'Content Creation',
        amount: 75.00,
        status: 'published',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: {
          skills: ['Copywriting', 'Social Media'],
          experience: 'Intermediate',
          tools: ['Canva or Adobe Creative Suite'],
        },
        published_at: new Date().toISOString(),
      },
      {
        creator_id: '11111111-1111-1111-1111-111111111111',
        title: 'Image Tagging and Categorization',
        description: 'Tag and categorize 500 product images with appropriate keywords.',
        category: 'Data Entry',
        amount: 30.00,
        status: 'draft',
      },
    ]

    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select()

    if (tasksError) {
      throw new Error(`Failed to create tasks: ${tasksError.message}`)
    }
    console.log(`✅ Created ${createdTasks.length} tasks (${createdTasks.filter(t => t.status === 'published').length} published)`)

    // 3. Create sample applications
    console.log('\n3️⃣ Creating sample applications...')

    const applications = [
      {
        task_id: createdTasks[0].id, // Data Entry task
        worker_id: '22222222-2222-2222-2222-222222222222',
        status: 'pending',
        cover_letter: 'I have extensive experience in data entry and can complete this task efficiently and accurately. I have access to Excel and can start immediately.',
        proposed_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        task_id: createdTasks[1].id, // Web Research task
        worker_id: '22222222-2222-2222-2222-222222222222',
        status: 'accepted',
        cover_letter: 'I specialize in market research and competitor analysis. I will provide a comprehensive report with all requested information.',
        proposed_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        task_id: createdTasks[2].id, // Social Media task
        worker_id: '22222222-2222-2222-2222-222222222222',
        status: 'pending',
        cover_letter: 'I am a creative content writer with experience in social media marketing. I can deliver engaging content that resonates with your audience.',
        proposed_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const { data: createdApplications, error: applicationsError } = await supabase
      .from('applications')
      .insert(applications)
      .select()

    if (applicationsError) {
      throw new Error(`Failed to create applications: ${applicationsError.message}`)
    }
    console.log(`✅ Created ${createdApplications.length} applications`)

    // 4. Create sample transaction
    console.log('\n4️⃣ Creating sample transaction...')

    const transaction = {
      task_id: createdTasks[1].id, // Web Research task (accepted application)
      client_id: '11111111-1111-1111-1111-111111111111',
      worker_id: '22222222-2222-2222-2222-222222222222',
      amount: 50.00,
      platform_fee: 9.00, // 18%
      worker_payout: 41.00,
      status: 'authorized',
      stripe_payment_intent_id: 'pi_test_123456789',
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()

    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`)
    }
    console.log('✅ Created transaction')

    // 5. Summary
    console.log('\n📊 Summary:')
    console.log(`   Users: ${users.length}`)
    console.log(`   Tasks: ${createdTasks.length} (${createdTasks.filter(t => t.status === 'published').length} published, ${createdTasks.filter(t => t.status === 'draft').length} draft)`)
    console.log(`   Applications: ${createdApplications.length}`)
    console.log('   Transactions: 1')

    console.log('\n🎉 Sample data seeding completed!\n')
    console.log('📋 Test Accounts:')
    console.log('   Client: client@example.com')
    console.log('   Worker: worker@example.com')
    console.log('   Both: both@example.com')
    console.log('\n💡 Note: These are database records only. For authentication, you need to create actual Supabase auth users.\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Ensure database schema has been executed')
    console.error('2. Check Supabase connection settings')
    console.error('3. Verify environment variables are correct\n')
    process.exit(1)
  }
}

seedData()
