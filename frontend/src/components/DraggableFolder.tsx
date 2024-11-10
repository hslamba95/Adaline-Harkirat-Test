import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Folder, Item } from '../types';
import { DraggableItem } from './DraggableItem';

interface Props {
  folder: Folder;
  items: Item[];
  onMove: (folderId: string, newOrder: number) => void;
  onMoveItem: (itemId: string, targetFolderId: string | null, newOrder: number) => void;
  onToggle: (folderId: string) => void;
}

export function DraggableFolder({ folder, items, onMove, onMoveItem, onToggle }: Props) {
  const [{ isDragging }, drag] = useDrag({
    type: 'FOLDER',
    item: { id: folder.id, type: 'FOLDER' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ['ITEM', 'FOLDER'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    drop: (droppedItem: { id: string, type: string }) => {
      if (droppedItem.type === 'ITEM') {
        onMoveItem(droppedItem.id, folder.id, items.length);
      } else if (droppedItem.type === 'FOLDER' && droppedItem.id !== folder.id) {
        onMove(droppedItem.id, folder.order);
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`border border-gray-200 rounded-lg shadow-sm ${isDragging ? 'opacity-50' : ''} ${
        isOver ? 'bg-gray-100' : 'bg-white'
      }`}
    >
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer"
        onClick={() => onToggle(folder.id)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">{folder.isOpen ? '📂' : '📁'}</span>
          <span className="text-gray-800 font-medium">{folder.name}</span>
        </div>
      </div>
      {folder.isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onMove={onMoveItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
