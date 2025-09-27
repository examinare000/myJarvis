import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../../components/TaskCard';

// TaskCardコンポーネントがまだ存在しない前提でテストを書く（TDD Red段階）

describe('TaskCard Component', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'This is a test task description',
    priority: 'high' as const,
    status: 'pending' as const,
    dueDate: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
  };

  it('should render task title and description', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    expect(screen.getByText(mockTask.description)).toBeInTheDocument();
  });

  it('should display priority badge', () => {
    render(<TaskCard task={mockTask} />);

    const priorityBadge = screen.getByText(/high/i);
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveClass('priority-high');
  });

  it('should display status indicator', () => {
    render(<TaskCard task={mockTask} />);

    const statusIndicator = screen.getByText(/pending/i);
    expect(statusIndicator).toBeInTheDocument();
  });

  it('should format and display due date', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText(/Dec 31, 2024/i)).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockTask.id);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<TaskCard task={mockTask} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('should call onComplete when complete button is clicked', () => {
    const onComplete = vi.fn();
    render(<TaskCard task={mockTask} onComplete={onComplete} />);

    const completeButton = screen.getByRole('button', { name: /complete/i });
    fireEvent.click(completeButton);

    expect(onComplete).toHaveBeenCalledWith(mockTask.id);
  });

  it('should apply completed styles when task is completed', () => {
    const completedTask = { ...mockTask, status: 'completed' as const };
    const { container } = render(<TaskCard task={completedTask} />);

    expect(container.firstChild).toHaveClass('task-completed');
  });
});