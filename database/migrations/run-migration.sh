#!/bin/bash

# Migration Runner Script
# Run database migrations against Supabase PostgreSQL

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}  TaskBridge Database Migration${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f "../../backend/.env" ]; then
  echo -e "${RED}Error: .env file not found in backend directory${NC}"
  echo "Please create backend/.env with SUPABASE_URL and SUPABASE_SERVICE_KEY"
  exit 1
fi

# Load environment variables
source ../../backend/.env

# Check required variables
if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}Error: SUPABASE_URL not set in .env${NC}"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}Error: SUPABASE_SERVICE_KEY not set in .env${NC}"
  exit 1
fi

# Extract database URL from SUPABASE_URL
# Format: https://PROJECT_REF.supabase.co
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

if [ -z "$PROJECT_REF" ]; then
  echo -e "${RED}Error: Could not extract PROJECT_REF from SUPABASE_URL${NC}"
  exit 1
fi

# Database connection string
DB_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

echo -e "${GREEN}✓${NC} Environment variables loaded"
echo -e "${GREEN}✓${NC} Project: $PROJECT_REF"
echo ""

# List available migrations
echo "Available migrations:"
for file in *.sql; do
  if [ -f "$file" ]; then
    echo "  - $file"
  fi
done
echo ""

# Run migrations
MIGRATION_FILE="${1:-20251101000000_add_app_testing_domain.sql}"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}Error: Migration file '$MIGRATION_FILE' not found${NC}"
  exit 1
fi

echo -e "${YELLOW}Running migration: $MIGRATION_FILE${NC}"
echo ""

# Execute migration using psql
if command -v psql &> /dev/null; then
  # Use psql if available
  psql "$DB_URL" -f "$MIGRATION_FILE"

  if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  Migration completed successfully!${NC}"
    echo -e "${GREEN}======================================${NC}"
  else
    echo ""
    echo -e "${RED}======================================${NC}"
    echo -e "${RED}  Migration failed!${NC}"
    echo -e "${RED}======================================${NC}"
    exit 1
  fi
else
  # Fallback to using curl if psql not available
  echo -e "${YELLOW}Note: psql not found, using Supabase API instead${NC}"
  echo -e "${YELLOW}Installing psql is recommended for better migration experience${NC}"
  echo ""

  SQL_CONTENT=$(cat "$MIGRATION_FILE")

  curl -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}"

  if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  Migration completed!${NC}"
    echo -e "${GREEN}======================================${NC}"
  else
    echo ""
    echo -e "${RED}======================================${NC}"
    echo -e "${RED}  Migration failed!${NC}"
    echo -e "${RED}======================================${NC}"
    exit 1
  fi
fi

echo ""
echo "Next steps:"
echo "1. Verify changes in Supabase Dashboard"
echo "2. Update backend API to use new fields"
echo "3. Update frontend forms for app_testing domain"
