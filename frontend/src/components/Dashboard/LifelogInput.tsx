import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Send, Add } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api';
import { useLifelogStore, LifelogEntry } from '@stores/useLifelogStore';

const lifelogSchema = z.object({
  content: z.string().min(1, '内容を入力してください').max(280, '280文字以内で入力してください'),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
  tags: z.array(z.string()).optional(),
});

type LifelogFormData = z.infer<typeof lifelogSchema>;

const moodOptions = [
  { value: 'great', label: '😊 最高', color: '#4caf50' },
  { value: 'good', label: '😊 良い', color: '#8bc34a' },
  { value: 'okay', label: '😐 普通', color: '#ffc107' },
  { value: 'bad', label: '😞 悪い', color: '#ff9800' },
  { value: 'terrible', label: '😱 最悪', color: '#f44336' },
];

const LifelogInput: React.FC = () => {
  const queryClient = useQueryClient();
  const { addEntry } = useLifelogStore();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LifelogFormData>({
    resolver: zodResolver(lifelogSchema),
    defaultValues: {
      content: '',
      mood: undefined,
      tags: [],
    },
  });

  const contentValue = watch('content', '');

  const createEntryMutation = useMutation<LifelogEntry, Error, {
    content: string;
    tags?: string[];
    mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  }>({
    mutationFn: async (data) => apiClient.createLifelogEntry(data) as Promise<LifelogEntry>,
    onSuccess: (newEntry) => {
      addEntry(newEntry);
      queryClient.invalidateQueries({ queryKey: ['lifelogEntries'] });
      reset();
      setTags([]);
      setTagInput('');
    },
  });

  const onSubmit = (data: LifelogFormData) => {
    createEntryMutation.mutate({
      ...data,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        ライフログ
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        {/* Content Input */}
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              multiline
              rows={4}
              fullWidth
              placeholder="今何をしていますか？考えていることは？"
              variant="outlined"
              error={!!errors.content}
              helperText={
                errors.content?.message || `${contentValue.length}/280文字`
              }
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Mood Selection */}
        <Controller
          name="mood"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>気分</InputLabel>
              <Select {...field} label="気分" value={field.value || ''}>
                <MenuItem value="">
                  <em>選択しない</em>
                </MenuItem>
                {moodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />

        {/* Tags Input */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="タグを追加"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              startIcon={<Add />}
            >
              追加
            </Button>
          </Box>

          {/* Tag Display */}
          {tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Error Display */}
        {createEntryMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            投稿に失敗しました: {createEntryMutation.error.message}
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={createEntryMutation.isPending}
          startIcon={
            createEntryMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              <Send />
            )
          }
        >
          {createEntryMutation.isPending ? '投稿中...' : '投稿'}
        </Button>
      </Box>
    </Paper>
  );
};

export default LifelogInput;