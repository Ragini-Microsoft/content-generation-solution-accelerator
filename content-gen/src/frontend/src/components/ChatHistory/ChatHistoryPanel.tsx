import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Spinner, 
  Body1, 
  Caption1,
  Link,
  Title3,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover
} from '@fluentui/react-components';
import { 
  MoreHorizontal20Regular,
  Delete20Regular,
  Open20Regular,
  Compose20Regular
} from '@fluentui/react-icons';
import { useChatContext } from '../../contexts/ChatContext';
import './ChatHistory.css';

const ChatHistoryPanel: React.FC = () => {
  const {
    selectedConversationId,
    setSelectedConversationId,
    triggerHistoryRefresh,
    setIsNewChat,
    conversations,
    setConversations,
    isLoadingConversation
  } = useChatContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations on component mount and when refresh is triggered
  useEffect(() => {
    console.log('[ChatHistory] Component mounting/refresh detected. Loading conversations...');
    loadConversations();
  }, [triggerHistoryRefresh]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ChatHistory] Loading conversations...');
      
      const userId = 'demo-user';
      const response = await fetch(`/api/conversations?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const formattedConversations = (data.conversations || []).map((conv: any) => ({
          id: conv.id,
          title: conv.title || 'Untitled Conversation',
          date: conv.timestamp || conv.updated_at,
          updatedAt: conv.updated_at
        }));
        
        setConversations(formattedConversations);
        console.log('[ChatHistory] Conversations set in context:', formattedConversations.length);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ChatHistory] API error:', response.status, errorData);
        setConversations([]);
      }
    } catch (err) {
      console.error('[ChatHistory] Failed to load conversations:', err);
      setError('Failed to load conversations. Please try again.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: { id: string; title: string; date: string; updatedAt?: string }) => {
    if (isLoadingConversation) {
      return;
    }
    
    console.log('Conversation clicked:', conversation);
    setSelectedConversationId(conversation.id);
    setIsNewChat(false);
  };

  const handleNewChatClick = () => {
    if (isLoadingConversation) {
      return;
    }
    
    console.log('New chat clicked');
    setSelectedConversationId(null);
    setIsNewChat(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return 'Today';
      } else if (diffDays === 2) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return dateString;
    }
  };

  const [showAll, setShowAll] = useState(false);
  const displayedConversations = showAll ? conversations : conversations.slice(0, 3);

  const renderConversationItem = (conversation: { id: string; title: string; date: string; updatedAt?: string }) => {
    const isSelected = selectedConversationId === conversation.id;
    const isCurrentlyLoading = isLoadingConversation && isSelected;
    
    return (
      <div
        key={conversation.id}
        className={`conversation-item ${isSelected ? 'selected' : ''} ${isLoadingConversation && !isSelected ? 'disabled' : ''}`}
        onClick={() => handleConversationClick(conversation)}
        style={{ 
          cursor: isLoadingConversation && !isSelected ? 'not-allowed' : 'pointer',
          opacity: isLoadingConversation && !isSelected ? 0.6 : 1
        }}
      >
        <div className="conversation-content">
          {isCurrentlyLoading ? (
            <div className="conversation-loading">
              <div className="mini-spinner"></div>
            </div>
          ) : null}
          <Body1 className="conversation-title" truncate>
            {conversation.title}
          </Body1>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button 
                appearance="subtle" 
                icon={<MoreHorizontal20Regular />} 
                size="small"
                className="conversation-menu-btn"
                onClick={(e) => e.stopPropagation()}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Open20Regular />}>Open</MenuItem>
                <MenuItem icon={<Delete20Regular />}>Delete</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="chat-history-container">
        <Title3 className="chat-history-title">Chat History</Title3>
        <div className="chat-history-list">
          <div className="loading-container">
            <Spinner size="small" />
            <Caption1>Loading...</Caption1>
          </div>
          <Button
            appearance="subtle"
            icon={<Compose20Regular />}
            onClick={handleNewChatClick}
            disabled
            className="new-chat-btn"
          >
            Start new chat
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-history-container">
        <Title3 className="chat-history-title">Chat History</Title3>
        <div className="chat-history-list">
          <div className="error-container">
            <Caption1>{error}</Caption1>
            <Link onClick={() => { setError(null); loadConversations(); }}>
              Retry
            </Link>
          </div>
          <Button
            appearance="subtle"
            icon={<Compose20Regular />}
            onClick={handleNewChatClick}
            className="new-chat-btn"
          >
            Start new chat
          </Button>
        </div>
      </div>
    );
  }

  const newChatButton = (
    <Button
      appearance="subtle"
      icon={<Compose20Regular />}
      onClick={handleNewChatClick}
      disabled={isLoadingConversation}
      className="new-chat-btn"
    >
      Start new chat
    </Button>
  );

  return (
    <div className="chat-history-container">
      <Title3 className="chat-history-title">Chat History</Title3>
      <div className="chat-history-list">
        {conversations.length === 0 ? (
          <>
            <div className="initial-msg">
              <Caption1>No conversations yet</Caption1>
            </div>
            {newChatButton}
          </>
        ) : (
          <>
            {displayedConversations.map((conversation) => 
              renderConversationItem(conversation)
            )}
            {conversations.length > 3 && !showAll && (
              <>
                <Link 
                  className="see-all-link"
                  onClick={() => setShowAll(true)}
                >
                  See all
                </Link>
                {newChatButton}
              </>
            )}
            {showAll && (
              <>
                {newChatButton}
                {conversations.length > 3 && (
                  <Link 
                    className="see-all-link"
                    onClick={() => setShowAll(false)}
                  >
                    Show less
                  </Link>
                )}
              </>
            )}
            {conversations.length <= 3 && newChatButton}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryPanel;

