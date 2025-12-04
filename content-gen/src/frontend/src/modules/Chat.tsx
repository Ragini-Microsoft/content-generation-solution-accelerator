// Chat Module - Stream-enabled Frontend Chat UI for Content Generation
// Adapted from Coral UI Components to work with Content Generation API

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Body1,
  Button,
  Tag,
  Tooltip as FluentTooltip,
  ToolbarDivider,
  Badge,
} from "@fluentui/react-components";
import { Copy, Send, Sparkle } from "../imports/bundleicons";
import { HeartRegular, ChatDismiss20Regular, Sparkle20Filled, Add20Regular } from "@fluentui/react-icons";
import "./Chat.css";
import "./prism-material-oceanic.css";
import { useChatContext } from "../contexts/ChatContext";
import type { ChatMessage, AgentResponse, CreativeBrief, GeneratedContent } from "../types";
import { BriefConfirmationMessage } from "../components/BriefConfirmationMessage";
import { GeneratedContentMessage } from "../components/GeneratedContentMessage";

interface ChatProps {
  userId: string;
  children?: React.ReactNode;
  onSendMessage?: (
    input: string,
    history: { role: string; content: string }[]
  ) => AsyncIterable<AgentResponse> | Promise<string>;
  onSaveMessage?: (
    userId: string,
    messages: { role: string; content: string }[]
  ) => void;
  onLoadHistory?: (
    userId: string
  ) => Promise<{ role: string; content: string }[]>;
  onClearHistory?: (userId: string) => void;
  pendingBrief?: CreativeBrief | null;
  onBriefConfirm?: (brief: CreativeBrief) => void;
  onBriefCancel?: () => void;
  onBriefEdit?: (brief: CreativeBrief) => void;
  onBriefLoaded?: (brief: CreativeBrief, isConfirmed: boolean) => void;
  generatedContent?: GeneratedContent | null;
  onRegenerate?: () => void;
  onGeneratedContentLoaded?: (content: GeneratedContent) => void;
  isGenerating?: boolean;
}

const Chat: React.FC<ChatProps> = ({
  userId,
  children,
  onSendMessage,
  onSaveMessage,
  onLoadHistory,
  onClearHistory,
  pendingBrief,
  onBriefConfirm,
  onBriefCancel,
  onBriefEdit,
  onBriefLoaded,
  generatedContent,
  onRegenerate,
  onGeneratedContentLoaded,
  isGenerating,
}) => {
  // State
  const [messages, setMessages] = useState<{ role: string; content: string; agent?: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);

  // Chat context integration
  const { 
    selectedConversationId, 
    setCurrentMessages,
    isLoadingConversation,
    setIsLoadingConversation,
    isNewChat,
    setSelectedConversationId,
    setIsNewChat
  } = useChatContext();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
  const isCreatingNewConversationRef = useRef(false);

  // Load conversation messages when selectedConversationId changes
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (isCreatingNewConversationRef.current) {
        console.log('Skipping load - currently creating new conversation');
        if (selectedConversationId) {
          setCurrentConversationId(selectedConversationId);
        }
        return;
      }

      if (selectedConversationId && 
          selectedConversationId !== currentConversationId && 
          !isNewChat) {
        try {
          setIsLoadingConversation(true);
          console.log('Loading conversation:', selectedConversationId);
          
          // Load conversation from API
          const userId = 'demo-user';
          const response = await fetch(`/api/conversations/${selectedConversationId}?user_id=${userId}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Raw conversation data:', data);
            console.log('Messages in conversation:', data.messages?.length || 0);
            console.log('Brief in conversation:', data.brief ? 'Yes' : 'No');
            console.log('Metadata:', data.metadata);
            
            const formattedMessages = (data.messages || []).map((msg: any) => ({
              role: msg.role,
              content: msg.content || msg.text || '',
              agent: msg.agent || '',
              timestamp: msg.timestamp
            }));
            
            console.log('Formatted messages:', formattedMessages);
            setMessages(formattedMessages);
            setCurrentMessages(data.messages || []);
            setCurrentConversationId(selectedConversationId);
            
            if (data.brief && onBriefLoaded) {
              try {
                const briefData = typeof data.brief === 'string' ? JSON.parse(data.brief) : data.brief;
                const isConfirmed = data.metadata?.status === 'brief_confirmed';
                onBriefLoaded(briefData, isConfirmed);
              } catch (e) {
                console.error('Error loading brief:', e);
              }
            }
            
            if (data.metadata?.generated_content && onGeneratedContentLoaded) {
              try {
                const contentData = typeof data.metadata.generated_content === 'string' 
                  ? JSON.parse(data.metadata.generated_content) 
                  : data.metadata.generated_content;
                onGeneratedContentLoaded(contentData);
              } catch (e) {
                console.error('Error loading generated content:', e);
              }
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to load conversation:', response.status, errorData);
          }
        } catch (error) {
          console.error('Failed to load conversation messages:', error);
          setMessages([]);
          setCurrentMessages([]);
        } finally {
          setIsLoadingConversation(false);
        }
      } else if (isNewChat || selectedConversationId === null) {
        setMessages([]);
        setCurrentMessages([]);
        setCurrentConversationId(undefined);
      } else if (selectedConversationId && isNewChat) {
        console.log('New conversation created, updating ID without reload:', selectedConversationId);
        setCurrentConversationId(selectedConversationId);
      }
    };

    loadConversationMessages();
  }, [selectedConversationId, currentConversationId, setCurrentMessages, setIsLoadingConversation, isNewChat]);

  // Load chat history on initial mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedConversationId && !isNewChat && onLoadHistory) {
        try {
          const historyMessages = await onLoadHistory(userId);
          if (historyMessages && historyMessages.length > 0) {
            setMessages(historyMessages);
          }
        } catch (err) {
          console.error("Failed to load chat history.", err);
        }
      }
    };

    loadHistory();
  }, [onLoadHistory, userId, selectedConversationId, isNewChat]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  }, [messages]);

  // Show scroll button if user is far from bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollTop + clientHeight < scrollHeight - 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Track input container height to offset scroll button
  useEffect(() => {
    if (inputContainerRef.current) {
      setInputHeight(inputContainerRef.current.offsetHeight);
    }
  }, [input, isFocused]);

  // Scroll to bottom programmatically
  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
    setShowScrollButton(false);
  };

  // Copy function
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Failed to copy text:", err);
    });
  };

  // Helper to check if a value is an AsyncIterable
  const isAsyncIterable = (value: any): value is AsyncIterable<any> => {
    return value !== null && 
           typeof value === 'object' && 
           Symbol.asyncIterator in value;
  };

  // Send message handler
  const sendMessage = async () => {
    if (!input.trim()) return;

    const updatedMessages = [...messages, { role: "user", content: input }];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);
    textareaRef.current && (textareaRef.current.style.height = "auto");

    try {
      if (onSendMessage) {
        setMessages(prevMessages => [...prevMessages, { role: "assistant", content: "", agent: "" }]);
        
        const response = onSendMessage(input, messages);
        
        if (isAsyncIterable(response)) {
          // Streaming response handling
          let assistantContent = "";
          let currentAgent = "";
          
          for await (const chunk of response) {
            if (chunk.type === 'agent_response') {
              assistantContent = chunk.content;
              currentAgent = chunk.agent || "";
              
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                  agent: currentAgent,
                };
                return updated;
              });
            }
          }
          
          onSaveMessage?.(userId, [
            ...updatedMessages,
            { role: "assistant", content: assistantContent },
          ]);
        } else {
          // Direct response handling
          const assistantResponse = await response;
          
          setMessages(prevMessages => {
            const updated = [...prevMessages];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantResponse,
            };
            return updated;
          });
          
          const newHistory = [...updatedMessages, { role: "assistant", content: assistantResponse }];
          onSaveMessage?.(userId, newHistory);
        }
      } else {
        // Fallback when no handler provided
        setMessages(prevMessages => [
          ...prevMessages,
          { role: "assistant", content: "No message handler configured." },
        ]);
      }
    } catch (err) {
      console.error("Send Message Error:", err);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: "assistant",
          content: "Oops! Something went wrong sending your message.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Clear chat handler
  const clearChat = async () => {
    try {
      if (onClearHistory) {
        onClearHistory(userId);
      }
      
      setMessages([]);
      setCurrentMessages([]);
      setCurrentConversationId(undefined);
      
      setSelectedConversationId(null);
      setIsNewChat(true);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  };

  // Expose method to set the creating flag
  useEffect(() => {
    (window as any).setCreatingNewConversation = (creating: boolean) => {
      isCreatingNewConversationRef.current = creating;
      console.log('Setting isCreatingNewConversation:', creating);
    };
  }, []);

  return (
    <div className="chat-container">
      {/* Messages Display */}
      <div
        className="messages"
        ref={messagesContainerRef}
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
      >
        {/* Loading indicator */}
        {isLoadingConversation && (
          <div className="loading-conversation" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '2rem',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div className="spinner" style={{
              width: '24px',
              height: '24px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #0078d4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <Body1>Loading conversation...</Body1>
          </div>
        )}
        
        {/* Welcome view with suggestion cards when empty */}
        {!isLoadingConversation && messages.length === 0 && (
          <div className="welcome-container">
            {/* Icon */}
            <div className="welcome-icon">
              <Sparkle20Filled style={{ fontSize: '32px', color: 'var(--colorBrandForeground1)' }} />
            </div>
            
            {/* Welcome text */}
            <h2 className="welcome-title">
              Welcome to your Content Generation Accelerator
            </h2>
            <p className="welcome-subtitle">
              Here are the options I can assist you with today
            </p>
            
            {/* Suggestion cards */}
            <div className="suggestion-cards">
              <button 
                className="suggestion-card"
                onClick={() => {
                  setInput("Generate ad copy and image ideas for a Facebook campaign promoting 'Paint for Home Décor'.");
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
              >
                <Sparkle style={{ color: 'var(--colorBrandForeground1)', flexShrink: 0 }} />
                <span>Generate ad copy and image ideas for a Facebook campaign promoting 'Paint for Home Décor'.</span>
              </button>
              
              <button 
                className="suggestion-card"
                onClick={() => {
                  setInput("Summarize my creative brief and suggest mood, audience, and image style for the campaign.");
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
              >
                <Sparkle style={{ color: 'var(--colorBrandForeground1)', flexShrink: 0 }} />
                <span>Summarize my creative brief and suggest mood, audience, and image style for the campaign.</span>
              </button>
              
              <button 
                className="suggestion-card"
                onClick={() => {
                  setInput("Create a multi-modal content plan with visuals and captions for an Instagram product launch.");
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
              >
                <Sparkle style={{ color: 'var(--colorBrandForeground1)', flexShrink: 0 }} />
                <span>Create a multi-modal content plan with visuals and captions for an Instagram product launch.</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Messages list */}
        {!isLoadingConversation && messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <Body1>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  whiteSpace: "pre-wrap",
                  width: "100%",
                }}
              >
                {/* Agent badge for assistant messages */}
                {msg.role === "assistant" && msg.agent && (
                  <Badge 
                    appearance="outline" 
                    size="small" 
                    style={{ marginBottom: '8px', alignSelf: 'flex-start' }}
                  >
                    {msg.agent}
                  </Badge>
                )}
                
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>

                {/* Actions for assistant messages */}
                {msg.role === "assistant" && msg.content && (
                  <div className="assistant-footer">
                    <div className="assistant-actions">
                      <Button
                        onClick={() => handleCopy(msg.content)}
                        title="Copy Response"
                        appearance="subtle"
                        style={{ height: 28, width: 28 }}
                        icon={<Copy />}
                      />
                      <Button
                        onClick={() =>
                          console.log("Heart clicked for response:", msg.content)
                        }
                        title="Like"
                        appearance="subtle"
                        style={{ height: 28, width: 28 }}
                        icon={<HeartRegular />}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Body1>
          </div>
        ))}
        
        {pendingBrief && onBriefConfirm && onBriefCancel && onBriefEdit && (
          <div className="message assistant">
            <Body1>
              <Badge 
                appearance="outline" 
                size="small" 
                style={{ marginBottom: '8px', alignSelf: 'flex-start' }}
              >
                PlanningAgent
              </Badge>
              <BriefConfirmationMessage
                brief={pendingBrief}
                onConfirm={onBriefConfirm}
                onCancel={onBriefCancel}
                onEdit={onBriefEdit}
              />
            </Body1>
          </div>
        )}

        {generatedContent && (
          <div className="message assistant">
            <Body1>
              <Badge 
                appearance="outline" 
                size="small" 
                style={{ marginBottom: '8px', alignSelf: 'flex-start' }}
              >
                ContentAgent
              </Badge>
              <GeneratedContentMessage
                content={generatedContent}
                onRegenerate={onRegenerate}
              />
            </Body1>
          </div>
        )}

        {(isTyping || isGenerating) && (
          <div className="typing-indicator">
            <span>{isGenerating ? 'Generating content...' : 'Thinking...'}</span>
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Tag
          onClick={scrollToBottom}
          className="scroll-to-bottom"
          shape="circular"
          style={{
            bottom: inputHeight,
            backgroundColor: "transparent",
            border:'1px solid var(--colorNeutralStroke3)',
            backdropFilter: "saturate(180%) blur(16px)",
          }}
        >
          Back to bottom
        </Tag>
      )}

      {/* Input area */}
      <div
        className={`input-wrapper ${isFocused ? "focused" : ""}`}
        ref={inputContainerRef}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Describe your marketing campaign or paste a creative brief..."
          rows={1}
          className="input-field"
          disabled={isTyping}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FluentTooltip content="AI-generated content may be incorrect." relationship="label">
            <Tag appearance="filled" size="small">AI-Generated</Tag>
          </FluentTooltip>

          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Start new chat button */}
            <Button
              onClick={clearChat}
              appearance="subtle"
              icon={<Add20Regular />}
              disabled={isTyping || messages.length === 0}
            />
            
            {/* Divider */}
            <ToolbarDivider vertical style={{ margin: '0 2px 0 0' }} />
            
            {/* Send button */}
            <Button 
              appearance="transparent" 
              onClick={sendMessage} 
              icon={<Send />} 
              disabled={isTyping || !input.trim()}
            />
          </div>
        </div>

        <span className="focus-indicator" />
      </div>
    </div>
  );
};

export default Chat;

