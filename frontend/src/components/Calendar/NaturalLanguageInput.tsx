import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Clear as ClearIcon,
  AutoFixHigh as AutoFixHighIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { parseNaturalLanguageEvent, NATURAL_LANGUAGE_EXAMPLES, ParseResult } from '@lib/dateParser';

interface NaturalLanguageInputProps {
  onEventCreate: (event: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    color?: string;
  }) => void;
  disabled?: boolean;
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onEventCreate,
  disabled = false
}) => {
  const [inputText, setInputText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
    setParseResult(null);
  };

  const handleParse = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);

    try {
      const result = parseNaturalLanguageEvent(inputText);
      setParseResult(result);
    } catch (error) {
      setParseResult({
        success: false,
        error: '解析中にエラーが発生しました',
        originalText: inputText
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateEvent = () => {
    if (!parseResult?.success || !parseResult.event) return;

    const { event } = parseResult;

    onEventCreate({
      title: event.title,
      description: event.description,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      color: '#2196F3'
    });

    // フォームをリセット
    setInputText('');
    setParseResult(null);
  };

  const handleClear = () => {
    setInputText('');
    setParseResult(null);
  };

  const handleExampleClick = (example: string) => {
    setInputText(example);
    setParseResult(null);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleParse();
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoFixHighIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            自然言語でイベント作成
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="例: 明日の午後2時に会議"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled || isProcessing}
            InputProps={{
              endAdornment: (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {inputText && (
                    <Tooltip title="クリア">
                      <IconButton
                        size="small"
                        onClick={handleClear}
                        disabled={disabled || isProcessing}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="解析">
                    <IconButton
                      size="small"
                      onClick={handleParse}
                      disabled={disabled || isProcessing || !inputText.trim()}
                      color="primary"
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )
            }}
            sx={{ mb: 1 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleParse}
              disabled={disabled || isProcessing || !inputText.trim()}
              startIcon={<ScheduleIcon />}
              size="small"
            >
              解析
            </Button>

            {parseResult?.success && (
              <Button
                variant="contained"
                onClick={handleCreateEvent}
                disabled={disabled}
                startIcon={<SendIcon />}
                size="small"
              >
                イベント作成
              </Button>
            )}
          </Box>
        </Box>

        {/* 解析結果の表示 */}
        {parseResult && (
          <Box sx={{ mb: 2 }}>
            {parseResult.success && parseResult.event ? (
              <Alert severity="success" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  解析結果:
                </Typography>
                <Typography variant="body2">
                  <strong>タイトル:</strong> {parseResult.event.title}
                </Typography>
                <Typography variant="body2">
                  <strong>開始:</strong> {parseResult.event.startTime.toLocaleString('ja-JP')}
                </Typography>
                <Typography variant="body2">
                  <strong>終了:</strong> {parseResult.event.endTime.toLocaleString('ja-JP')}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="error">
                {parseResult.error}
              </Alert>
            )}
          </Box>
        )}

        {/* 使用例 */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
            使用例:
          </Typography>
          <Grid container spacing={1}>
            {NATURAL_LANGUAGE_EXAMPLES.slice(0, 6).map((example, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Chip
                  label={example}
                  variant="outlined"
                  size="small"
                  clickable
                  onClick={() => handleExampleClick(example)}
                  sx={{
                    fontSize: '0.75rem',
                    height: 'auto',
                    py: 0.5,
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageInput;