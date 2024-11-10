// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('getInitialState', async () => {
    try {
      const items = await prisma.item.findMany({
        orderBy: { order: 'asc' }
      });
      const folders = await prisma.folder.findMany({
        orderBy: { order: 'asc' }
      });
      socket.emit('initialState', { items, folders });
    } catch (error) {
      console.error('Error getting initial state:', error);
    }
  });

  socket.on('addItem', async (newItem) => {
    try {
      const lastItem = await prisma.item.findFirst({
        where: { folderId: newItem.folderId },
        orderBy: { order: 'desc' }
      });

      await prisma.item.create({
        data: {
          ...newItem,
          order: lastItem ? lastItem.order + 1 : 0
        }
      });

      const items = await prisma.item.findMany({
        orderBy: { order: 'asc' }
      });
      const folders = await prisma.folder.findMany({
        orderBy: { order: 'asc' }
      });

      io.emit('stateUpdate', { items, folders });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  });

  socket.on('addFolder', async (newFolder) => {
    try {
      const lastFolder = await prisma.folder.findFirst({
        orderBy: { order: 'desc' }
      });

      await prisma.folder.create({
        data: {
          ...newFolder,
          order: lastFolder ? lastFolder.order + 1 : 0
        }
      });

      const items = await prisma.item.findMany({
        orderBy: { order: 'asc' }
      });
      const folders = await prisma.folder.findMany({
        orderBy: { order: 'asc' }
      });

      io.emit('stateUpdate', { items, folders });
    } catch (error) {
      console.error('Error adding folder:', error);
    }
  });

  socket.on('moveItem', async ({ itemId, targetFolderId, newOrder }) => {
    try {
      // Get the current item
      const currentItem = await prisma.item.findUnique({
        where: { id: itemId }
      });

      if (!currentItem) return;

      // Update orders in the source folder/location
      await prisma.item.updateMany({
        where: {
          folderId: currentItem.folderId,
          order: { gt: currentItem.order }
        },
        data: {
          order: { decrement: 1 }
        }
      });

      // Update orders in the target folder/location
      await prisma.item.updateMany({
        where: {
          folderId: targetFolderId,
          order: { gte: newOrder }
        },
        data: {
          order: { increment: 1 }
        }
      });

      // Move the item
      await prisma.item.update({
        where: { id: itemId },
        data: {
          folderId: targetFolderId,
          order: newOrder
        }
      });

      const items = await prisma.item.findMany({
        orderBy: { order: 'asc' }
      });
      const folders = await prisma.folder.findMany({
        orderBy: { order: 'asc' }
      });

      io.emit('stateUpdate', { items, folders });
    } catch (error) {
      console.error('Error moving item:', error);
    }
  });

  socket.on('moveFolder', async ({ folderId, newOrder }) => {
    try {
      // Get the current folder
      const currentFolder = await prisma.folder.findUnique({
        where: { id: folderId }
      });

      if (!currentFolder) return;

      // Update orders of other folders
      if (newOrder > currentFolder.order) {
        // Moving down
        await prisma.folder.updateMany({
          where: {
            order: {
              gt: currentFolder.order,
              lte: newOrder
            }
          },
          data: {
            order: { decrement: 1 }
          }
        });
      } else {
        // Moving up
        await prisma.folder.updateMany({
          where: {
            order: {
              gte: newOrder,
              lt: currentFolder.order
            }
          },
          data: {
            order: { increment: 1 }
          }
        });
      }

      // Move the folder
      await prisma.folder.update({
        where: { id: folderId },
        data: { order: newOrder }
      });

      const items = await prisma.item.findMany({
        orderBy: { order: 'asc' }
      });
      const folders = await prisma.folder.findMany({
        orderBy: { order: 'asc' }
      });

      io.emit('stateUpdate', { items, folders });
    } catch (error) {
      console.error('Error moving folder:', error);
    }
  });

  socket.on('toggleFolder', async (folderId) => {
    try {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });

      if (folder) {
        await prisma.folder.update({
          where: { id: folderId },
          data: { isOpen: !folder.isOpen }
        });

        const items = await prisma.item.findMany({
          orderBy: { order: 'asc' }
        });
        const folders = await prisma.folder.findMany({
          orderBy: { order: 'asc' }
        });

        io.emit('stateUpdate', { items, folders });
      }
    } catch (error) {
      console.error('Error toggling folder:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
