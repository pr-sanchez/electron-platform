import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { InboxItem } from './types';
import { useLogger } from './hooks/useLogger';

// Generate fake inbox items (500-2000 items)
const generateInboxItems = (count: number): InboxItem[] => {
  const items: InboxItem[] = [];
  const titles = [
    'Meeting Request',
    'Project Update',
    'Code Review',
    'Bug Report',
    'Feature Proposal',
    'Documentation Update',
    'Security Alert',
    'Performance Report',
    'User Feedback',
    'System Notification',
  ];

  for (let i = 0; i < count; i++) {
    const titleIndex = i % titles.length;
    items.push({
      id: `item-${i}`,
      title: `${titles[titleIndex]} #${Math.floor(i / titles.length) + 1}`,
      subtitle: `From: user${i % 100}@example.com`,
      content: `This is the detailed content for ${titles[titleIndex]} #${Math.floor(i / titles.length) + 1}. 
      
It contains multiple paragraphs of information that would be displayed in the detail view when this item is selected.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

The item was created at timestamp ${Date.now() - i * 1000} and has various metadata associated with it.`,
      timestamp: Date.now() - i * 1000,
    });
  }

  return items;
};

interface InboxViewProps {
  searchQuery: string;
}

const InboxView: React.FC<InboxViewProps> = ({ searchQuery }) => {
  const logger = useLogger();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(600);

  // Generate 1000 items for the POC
  const allItems = useMemo(() => generateInboxItems(1000), []);
  
  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const query = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
    );
  }, [allItems, searchQuery]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) || null;
  }, [filteredItems, selectedId]);

  // Auto-select first item if none selected
  React.useEffect(() => {
    if (!selectedId && filteredItems.length > 0) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  // Calculate list height based on container
  useEffect(() => {
    const updateHeight = () => {
      if (listContainerRef.current) {
        const rect = listContainerRef.current.getBoundingClientRect();
        setListHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleItemClick = (id: string): void => {
    setSelectedId(id);
    logger.info('inbox-item-selected', { itemId: id });
  };

  // List item renderer for virtualization
  const Row: React.FC<{ index: number; style: React.CSSProperties }> = ({
    index,
    style,
  }) => {
    const item = filteredItems[index];
    const isSelected = item.id === selectedId;

    return (
      <div
        style={style}
        className={`list-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handleItemClick(item.id)}
      >
        <div className="list-item-title">{item.title}</div>
        <div className="list-item-subtitle">{item.subtitle}</div>
      </div>
    );
  };

  return (
    <div className="main-content">
      <div className="left-panel">
        <div className="list-header">
          Inbox ({filteredItems.length} items)
        </div>
        <div className="list-container" ref={listContainerRef}>
          {filteredItems.length > 0 ? (
            <List
              height={listHeight}
              itemCount={filteredItems.length}
              itemSize={60}
              width="100%"
            >
              {Row}
            </List>
          ) : (
            <div className="detail-empty">No items found</div>
          )}
        </div>
      </div>

      <div className="right-panel">
        {selectedItem ? (
          <>
            <div className="detail-header">
              <div className="detail-title">{selectedItem.title}</div>
              <div className="detail-meta">{selectedItem.subtitle}</div>
            </div>
            <div className="detail-content">{selectedItem.content}</div>
          </>
        ) : (
          <div className="detail-empty">Select an item to view details</div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
