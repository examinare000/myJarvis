import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import aiService, { ChatMessage } from '../services/aiService';
import { useAuthStore } from '../store/authStore';

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with a welcome message
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `こんにちは、${user?.name || 'ユーザー'}さん！AIアシスタントのJarvisです。タスク管理、スケジューリング、生産性分析などをお手伝いします。何かご質問はありますか？`,
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Check for special commands
    if (input.toLowerCase().includes('スケジュール') || input.toLowerCase().includes('schedule')) {
      await handleSmartScheduling();
    } else if (input.toLowerCase().includes('分析') || input.toLowerCase().includes('analyze')) {
      await handleContextAnalysis();
    } else if (input.toLowerCase().includes('提案') || input.toLowerCase().includes('suggest')) {
      await handleTaskSuggestions();
    } else {
      await handleNormalChat(userMessage);
    }
  };

  const handleNormalChat = async (userMessage: Message) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      await aiService.streamChat(
        {
          messages: messages.map(({ role, content }) => ({ role, content })).concat({
            role: 'user',
            content: userMessage.content,
          }),
        },
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: 'エラーが発生しました。もう一度お試しください。', isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartScheduling = async () => {
    try {
      const schedule = await aiService.generateSmartSchedule({
        workingHours: { start: '09:00', end: '18:00' },
        breakDuration: 15,
        maxTasksPerDay: 5,
      });

      const scheduleMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: formatScheduleResponse(schedule),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, scheduleMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'スケジュールの生成中にエラーが発生しました。',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextAnalysis = async () => {
    try {
      const analysis = await aiService.analyzeContext({ timeframe: 'week' });

      const analysisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: formatAnalysisResponse(analysis),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, analysisMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '分析中にエラーが発生しました。',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskSuggestions = async () => {
    try {
      const suggestions = await aiService.getTaskSuggestions();

      const suggestionMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: formatSuggestionsResponse(suggestions.suggestions),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, suggestionMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '提案の生成中にエラーが発生しました。',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatScheduleResponse = (schedule: any) => {
    let response = '📅 **スマートスケジュール**\n\n';

    schedule.optimizedSchedule.slice(0, 3).forEach((day: any) => {
      response += `**${day.date}**\n`;
      day.tasks.forEach((task: any) => {
        response += `• ${task.suggestedTime} - ${task.title} (${task.duration}分)\n`;
      });
      response += '\n';
    });

    if (schedule.suggestions.length > 0) {
      response += '💡 **提案:**\n';
      schedule.suggestions.forEach((suggestion: string) => {
        response += `• ${suggestion}\n`;
      });
    }

    return response;
  };

  const formatAnalysisResponse = (analysis: any) => {
    return `📊 **生産性分析**

**スコア:** ${analysis.productivity.score}%
**トレンド:** ${analysis.productivity.trend === 'improving' ? '📈 改善中' : analysis.productivity.trend === 'stable' ? '➡️ 安定' : '📉 低下中'}

**気分パターン:**
• 主な気分: ${analysis.mood.dominant}

**洞察:**
${analysis.insights.map((insight: string) => `• ${insight}`).join('\n')}

**推奨事項:**
${analysis.recommendations.map((rec: string) => `• ${rec}`).join('\n')}`;
  };

  const formatSuggestionsResponse = (suggestions: string[]) => {
    return `💡 **タスク提案**

${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

これらのタスクを追加しますか？`;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    handleMenuClose();
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI Assistant</Typography>
        </Box>
        <IconButton onClick={handleMenuOpen}>
          <MoreIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleQuickAction('今日のスケジュールを最適化して')}>
            <ScheduleIcon sx={{ mr: 1 }} fontSize="small" />
            スケジュール最適化
          </MenuItem>
          <MenuItem onClick={() => handleQuickAction('今週の生産性を分析して')}>
            <AnalyticsIcon sx={{ mr: 1 }} fontSize="small" />
            生産性分析
          </MenuItem>
          <MenuItem onClick={() => handleQuickAction('タスクの提案をして')}>
            <SuggestionIcon sx={{ mr: 1 }} fontSize="small" />
            タスク提案
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                gap: 1,
                alignItems: 'flex-start',
              }}
            >
              <Avatar sx={{ bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main' }}>
                {message.role === 'user' ? <PersonIcon /> : <AIIcon />}
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                }}
                elevation={1}
              >
                <ListItemText
                  primary={
                    <Typography component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                      {message.isStreaming && <CircularProgress size={10} sx={{ ml: 1 }} />}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  }
                />
              </Paper>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip
            label="スケジュール"
            size="small"
            onClick={() => setInput('今日のスケジュールを最適化して')}
            icon={<ScheduleIcon />}
          />
          <Chip
            label="分析"
            size="small"
            onClick={() => setInput('今週の生産性を分析して')}
            icon={<AnalyticsIcon />}
          />
          <Chip
            label="提案"
            size="small"
            onClick={() => setInput('タスクの提案をして')}
            icon={<SuggestionIcon />}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="メッセージを入力..."
            disabled={isLoading}
            size="small"
            multiline
            maxRows={4}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default AIChat;