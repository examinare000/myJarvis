import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api';
import { useTaskStore, Task, TaskStats } from '@stores/useTaskStore';

const TodayTasksPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { setTodayTasks, setTaskStats, updateTaskInList } = useTaskStore();

  // Fetch today's tasks
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery<Task[], Error>({
    queryKey: ['todayTasks'],
    queryFn: () => apiClient.getTodayTasks(),
  });

  React.useEffect(() => {
    if (tasks) {
      setTodayTasks(tasks);
    }
  }, [tasks, setTodayTasks]);

  // Fetch task statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<TaskStats, Error>({
    queryKey: ['todayTaskStats'],
    queryFn: () => apiClient.getTodayTaskStats(),
  });

  React.useEffect(() => {
    if (stats) {
      setTaskStats(stats);
    }
  }, [stats, setTaskStats]);

  // Update task status mutation
  const updateStatusMutation = useMutation<Task, Error, { taskId: string; status: Task['status'] }>({
    mutationFn: ({ taskId, status }) => apiClient.updateTaskStatus(taskId, status),
    onSuccess: (updatedTask) => {
      updateTaskInList(updatedTask.id, updatedTask);
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['todayTaskStats'] });
    },
  });

  const handleStatusToggle = (task: Task) => {
    const nextStatus: Task['status'] =
      task.status === 'DONE' ? 'TODO' :
      task.status === 'TODO' ? 'IN_PROGRESS' :
      'DONE';

    updateStatusMutation.mutate({
      taskId: task.id,
      status: nextStatus,
    });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle color="success" />;
      case 'IN_PROGRESS':
        return <PlayArrow color="primary" />;
      default:
        return <RadioButtonUnchecked color="action" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isLoading = tasksLoading || statsLoading;
  const hasError = tasksError || statsError;

  if (hasError) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">
          タスクの読み込みに失敗しました: {(tasksError || statsError)?.message}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          今日のタスク
        </Typography>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="primary">
                    {stats.total}
                  </Typography>
                  <Typography variant="caption">合計</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="success.main">
                    {stats.done}
                  </Typography>
                  <Typography variant="caption">完了</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="info.main">
                    {stats.inProgress}
                  </Typography>
                  <Typography variant="caption">進行中</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="warning.main">
                    {stats.completionRate}%
                  </Typography>
                  <Typography variant="caption">完了率</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Task List */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List dense>
            {tasks?.map((task: Task) => (
              <ListItem
                key={task.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: task.status === 'DONE' ? 'action.hover' : 'background.paper',
                }}
              >
                <ListItemIcon>
                  <IconButton
                    size="small"
                    onClick={() => handleStatusToggle(task)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {getStatusIcon(task.status)}
                  </IconButton>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                          opacity: task.status === 'DONE' ? 0.6 : 1,
                        }}
                      >
                        {task.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={task.priority}
                        color={getPriorityColor(task.priority)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={task.description}
                />
              </ListItem>
            ))}
            {tasks?.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                今日のタスクはありません
              </Typography>
            )}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default TodayTasksPanel;
