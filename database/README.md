# Database Setup Files

This directory contains all database-related setup files for TaskBridge.

## Files

### `schema.sql`
Complete database schema including:
- 4 main tables: `users`, `tasks`, `applications`, `transactions`
- Indexes for performance optimization
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

### `SETUP.md`
Step-by-step guide for:
- Creating Supabase project
- Executing database schema
- Configuring authentication
- Getting API keys
- Testing connection

## Quick Start

1. **Create Supabase Project**
   - Visit https://supabase.com
   - Create new project
   - Note down project URL and keys

2. **Execute Schema**
   ```bash
   # Copy contents of schema.sql
   # Paste in Supabase SQL Editor
   # Click "Run"
   ```

3. **Update Environment Variables**
   ```bash
   # Frontend (.env)
   VITE_SUPABASE_URL=your_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   # Backend (.env)
   SUPABASE_URL=your_url_here
   SUPABASE_SERVICE_KEY=your_service_key_here
   ```

4. **Test Connection**
   ```bash
   cd backend
   npm run test:supabase
   ```

## Database Structure

```
users (authentication & profiles)
  ├── tasks (job postings)
  │     └── applications (worker applications)
  └── transactions (payments & transfers)
```

## Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Public can view published tasks only
- ✅ Service key bypasses RLS for backend operations

## Next Steps

After database setup:
1. Test user registration
2. Create sample data
3. Implement authentication flows
4. Build task posting functionality

For detailed instructions, see [SETUP.md](./SETUP.md)
