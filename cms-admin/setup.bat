@echo off
echo 🚀 Setting up ByFoods CMS Admin Dashboard...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create .env.local file if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local file...
    copy env.local .env.local
    echo ✅ .env.local file created. Please update it with your API URL.
) else (
    echo ✅ .env.local file already exists.
)

echo ✅ Setup completed!
echo.
echo Next steps:
echo 1. Make sure the backend API is running on http://localhost:3001
echo 2. Update .env.local if needed
echo 3. Run 'npm run dev' to start the development server
echo 4. Open http://localhost:3002 in your browser
echo.
echo Default admin credentials:
echo Email: admin@byfoods.com
echo Password: admin123
pause
