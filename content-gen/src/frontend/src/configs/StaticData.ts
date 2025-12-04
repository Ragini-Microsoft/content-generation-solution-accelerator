// Static data for fallback scenarios when API calls fail
import type { Conversation } from '../types';

export const historyReadResponse = {
  messages: [
    {
      id: "msg-1",
      role: "user" as const,
      content: {
        content: "Hello, how can you help me today?"
      },
      createdAt: new Date().toISOString(),
      feedback: undefined,
      context: null,
      contentType: "text"
    },
    {
      id: "msg-2", 
      role: "assistant" as const,
      content: {
        content: "Hello! I'm here to help you with any questions or tasks you might have. I can assist with information, analysis, writing, and much more. What would you like to know or work on today?",
        citations: []
      },
      createdAt: new Date().toISOString(),
      feedback: undefined,
      context: null,
      contentType: "text"
    }
  ]
};

export const historyListResponse: any[] = [
  {
    id: "conv-1",
    title: "Getting Started",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "conv-2", 
    title: "Project Discussion",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "conv-3",
    title: "Data Analysis",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Sample conversations for complete fallback
export const sampleConversations: Conversation[] = [
  {
    id: "conv-1",
    user_id: "demo-user",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Hello, how can you help me today?",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "msg-2",
        role: "assistant", 
        content: "Hello! I'm here to help you with any questions or tasks you might have.",
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
      }
    ],
    updated_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
  }
];

