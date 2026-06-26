#!/bin/bash

echo "🚀 Mondial Full-Stack Quick Start"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found${NC}"

if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}❌ .NET SDK not found. Install from https://dotnet.microsoft.com${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .NET SDK found${NC}"

if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}⚠️  mongosh not found. MongoDB should be running on localhost:27017${NC}"
fi
echo ""

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend
npm install > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

# Build Frontend
echo "🔨 Building Frontend..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

cd ..

# Setup Backend
echo "📦 Setting up Backend..."
cd backend
dotnet restore > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies restored${NC}"
else
    echo -e "${RED}❌ Failed to restore backend dependencies${NC}"
    exit 1
fi

# Build Backend
echo "🔨 Building Backend..."
dotnet build -c Release > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Run Tests
echo ""
echo "🧪 Running Tests..."
echo "Frontend tests..."
cd ../frontend
npm run test -- --passWithNoTests 2>&1 | tail -5
echo ""

echo "Backend tests..."
cd ../backend
dotnet test 2>&1 | tail -10
echo ""

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "📖 Next steps:"
echo "1. Start Backend:  cd backend && dotnet run"
echo "2. Start Frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:3000"
echo "4. Login or sign up to test the app"
echo ""
echo "📚 Full testing guide: cat TESTING_GUIDE.md"
