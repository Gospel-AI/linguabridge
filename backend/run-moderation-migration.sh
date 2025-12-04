#!/bin/bash

# Content Moderation System - Database Migration Script
# Run this script to set up the moderation tables

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_DB_PASSWORD must be set"
  exit 1
fi

# Extract database connection details from Supabase URL
# Format: https://PROJECT_REF.supabase.co
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co//')

# Database connection string
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

echo "🚀 Starting Content Moderation Migration..."
echo "📍 Project: $PROJECT_REF"
echo ""

# Run migration
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f migrations/008_content_moderation.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "📋 Created tables:"
  echo "   - moderation_queue (for human review)"
  echo "   - moderation_logs (audit trail)"
  echo "   - task_reports (community reporting)"
  echo ""
  echo "📋 Created views:"
  echo "   - moderation_dashboard"
  echo "   - reports_dashboard"
  echo ""
  echo "🔒 RLS policies enabled for all tables"
else
  echo ""
  echo "❌ Migration failed!"
  exit 1
fi
