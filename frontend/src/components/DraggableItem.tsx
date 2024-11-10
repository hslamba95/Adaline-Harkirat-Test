import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Item } from '../types';

interface Props {
  item: Item;
  onMove: (itemId: string, targetFolderId: string | null, newOrder: number) => void;
}

export function DraggableItem({ item, onMove }: Props) {
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { id: item.id, type: 'ITEM' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'ITEM',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    drop: (droppedItem: { id: string }) => {
      if (droppedItem.id !== item.id) {
        onMove(droppedItem.id, item.folderId, item.order);
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move ${
        isDragging ? 'opacity-50' : ''
      } ${isOver ? 'bg-gray-100' : ''}`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{item.icon}</span>
        <span className="text-gray-800 font-medium">{item.title}</span>
      </div>
    </div>
  );
}
