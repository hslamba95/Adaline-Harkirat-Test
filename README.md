The application will allow you to:

Create new items with icons (you can use emojis as icons)
Create new folders
Drag and drop items between folders
Drag and drop folders to reorder them
Toggle folders open/closed
All changes will be synchronized in real-time across multiple browser windows

All data is persisted in a SQLite database (created automatically by Prisma) and will be available even after restarting the application.

Steps to run backend 
1. cd backend
2. npm install
3. npx prisma generate
4. npx prisma migrate dev --name init
5. npm run dev

Steps to run frontend
1. cd frontend
2. npm install
3. npm start
