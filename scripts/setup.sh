#!/bin/bash
set -e

echo "🦷 Setting up Oradent Dental Practice Management System..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed."; exit 1; }

# Copy env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example - please update with your values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start database and Redis
echo "🐘 Starting PostgreSQL and Redis..."
docker compose up -d db redis

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 3

# Run migrations
echo "🔄 Running database migrations..."
cd packages/server && npx prisma migrate dev --name init && cd ../..

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/server && npx prisma generate && cd ../..

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Setup complete! Run 'npm run dev' to start the development servers."
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:4000"
echo "📊 Prisma:   npx prisma studio (in packages/server)"
echo ""
echo "Default login: sarah@brightsmiles.com / password123"
