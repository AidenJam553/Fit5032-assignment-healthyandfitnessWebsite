@echo off
echo Building project for production...
call npm run build

echo Copying deployment files to dist directory...
copy _headers dist\
copy _redirects dist\

echo Build completed! 
echo.
echo Next steps:
echo 1. Go to https://pages.cloudflare.com/
echo 2. Create a new project
echo 3. Upload the 'dist' folder
echo 4. Configure environment variables as shown in DEPLOYMENT.md
echo.
echo Your dist folder is ready for deployment!
pause
