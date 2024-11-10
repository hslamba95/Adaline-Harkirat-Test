import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Socket, io } from 'socket.io-client';
import { Folder, Item } from './types';
import { DraggableItem } from './components/DraggableItem';
import { DraggableFolder } from './components/DraggableFolder';
import { AddItemForm } from './components/AddItemForm';
import { AddFolderForm } from './components/AddFolderForm';

const SOCKET_URL = 'http://localhost:3001';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('getInitialState');
    });

    newSocket.on('initialState', (data: { items: Item[]; folders: Folder[] }) => {
      setItems(data.items);
      setFolders(data.folders);
    });

    newSocket.on('stateUpdate', (data: { items: Item[]; folders: Folder[] }) => {
      setItems(data.items);
      setFolders(data.folders);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleAddItem = (title: string, icon: string) => {
    if (!socket) return;
    
    const newItem: Partial<Item> = {
      title,
      icon,
      folderId: null,
      order: items.length,
    };
    
    socket.emit('addItem', newItem);
  };

  const handleAddFolder = (name: string) => {
    if (!socket) return;
    
    const newFolder: Partial<Folder> = {
      name,
      isOpen: true,
      order: folders.length,
    };
    
    socket.emit('addFolder', newFolder);
  };

  const handleMoveItem = (itemId: string, targetFolderId: string | null, newOrder: number) => {
    if (!socket) return;
    socket.emit('moveItem', { itemId, targetFolderId, newOrder });
  };

  const handleMoveFolder = (folderId: string, newOrder: number) => {
    if (!socket) return;
    socket.emit('moveFolder', { folderId, newOrder });
  };

  const handleToggleFolder = (folderId: string) => {
    if (!socket) return;
    socket.emit('toggleFolder', folderId);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 space-y-4">
          <AddItemForm onAdd={handleAddItem} />
          <AddFolderForm onAdd={handleAddFolder} />
        </div>
        
        <div className="space-y-4">
          {folders
            .filter(folder => !folder.folderId)
            .sort((a, b) => a.order - b.order)
            .map(folder => (
              <DraggableFolder
                key={folder.id}
                folder={folder}
                items={items.filter(item => item.folderId === folder.id)}
                onMove={handleMoveFolder}
                onMoveItem={handleMoveItem}
                onToggle={handleToggleFolder}
              />
            ))}
          
          {items
            .filter(item => !item.folderId)
            .sort((a, b) => a.order - b.order)
            .map(item => (
              <DraggableItem
                key={item.id}
                item={item}
                onMove={handleMoveItem}
              />
            ))}
        </div>
      </div>
    </DndProvider>
  );
}
