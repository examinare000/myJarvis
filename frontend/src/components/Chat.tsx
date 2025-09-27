import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { useSocket } from '../hooks/useSocket';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, sendMessage } = useSocket('http://localhost:3001');

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for AI responses
  useEffect(() => {
    if (!window.io) return;

    const socket = window.io('http://localhost:3001');

    socket.on('ai:response', (data: any) => {
      if (data.choices?.[0]?.delta?.content) {
        setAiResponse(prev => prev + data.choices[0].delta.content);
      }
    });

    socket.on('ai:complete', () => {
      if (aiResponse) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: aiResponse,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev.filter(m => !m.isStreaming), aiMessage]);
        setAiResponse('');
        setIsTyping(false);
      }
    });

    socket.on('ai:error', (error: any) => {
      console.error('AI error:', error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Error: ${error.message}`,
        role: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    });

    socket.on('chat:message', (message: any) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message.text,
        role: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      socket.off('ai:response');
      socket.off('ai:complete');
      socket.off('ai:error');
      socket.off('chat:message');
    };
  }, [aiResponse]);

  // Update streaming message
  useEffect(() => {
    if (aiResponse && isTyping) {
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isStreaming);
        return [...filtered, {
          id: 'streaming',
          content: aiResponse,
          role: 'assistant',
          timestamp: new Date(),
          isStreaming: true
        }];
      });
    }
  }, [aiResponse, isTyping]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to AI through WebSocket
    sendMessage('ai:chat', {
      message: inputMessage,
      model: 'llama2'
    });

    setInputMessage('');
    setIsTyping(true);
    setAiResponse('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h2">
            AI Assistant Chat
          </Typography>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                alignItems="flex-start"
                sx={{
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Box sx={{ mx: 1 }}>
                  {message.role === 'user' ? (
                    <PersonIcon color="primary" />
                  ) : message.role === 'assistant' ? (
                    <SmartToyIcon color="secondary" />
                  ) : null}
                </Box>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.role === 'user'
                      ? 'primary.light'
                      : message.role === 'assistant'
                      ? 'secondary.light'
                      : 'error.light',
                    opacity: message.isStreaming ? 0.8 : 1
                  }}
                >
                  <Typography variant="body1">
                    {message.content}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
            {isTyping && !aiResponse && (
              <ListItem>
                <Box sx={{ mx: 1 }}>
                  <SmartToyIcon color="secondary" />
                </Box>
                <CircularProgress size={20} />
                <Typography sx={{ ml: 2 }}>AI is thinking...</Typography>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        <Divider />

        {/* Input */}
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || isTyping}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            disabled={!isConnected || isTyping || !inputMessage.trim()}
            endIcon={<SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;