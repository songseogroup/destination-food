@echo off
echo 🚀 Setting up ByFoods CMS Backend...

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

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy env.example .env
    echo ✅ .env file created. Please update it with your database credentials.
) else (
    echo ✅ .env file already exists.
)

REM Create uploads directory
echo 📁 Creating uploads directory...
if not exist uploads mkdir uploads

echo ✅ Setup completed!
echo.
echo Next steps:
echo 1. Update the .env file with your database credentials
echo 2. Make sure MySQL is running and create a database named 'byfoods_cms'
echo 3. Run 'npm run start:dev' to start the development server
echo.
echo Default admin credentials:
echo Email: admin@byfoods.com
echo Password: admin123
pause
