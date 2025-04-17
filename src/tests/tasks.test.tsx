/**
 * Tasks Components Tests
 * 
 * This file contains tests for the tasks components to make sure they work properly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TasksList } from '@/components/tasks/TasksList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Task, TaskType } from '@/types';
import { tasksApi } from '@/services/api';

// Mock the API service
jest.mock('@/services/api', () => ({
  tasksApi: {
    toggleTaskCompletion: jest.fn(),
    deleteTask: jest.fn(),
    updateTask: jest.fn(),
    createTask: jest.fn(),
  }
}));

// Mock the toast component
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Tasks Components', () => {
  // Sample task data for testing
  const mockTasks: Task[] = [
    {
      id: '1',
      created_at: new Date().toISOString(),
      title: 'Test Task 1',
      subject: 'חשבון',
      description: 'Test description 1',
      type: TaskType.CLASS,
      is_completed: false,
      user_id: 'user123',
    },
    {
      id: '2',
      created_at: new Date().toISOString(),
      title: 'Test Task 2',
      subject: 'אנגלית',
      description: 'Test description 2',
      type: TaskType.PERSONAL,
      is_completed: true,
      user_id: 'user123',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TasksList', () => {
    test('renders with initial tasks', () => {
      render(<TasksList initialTasks={mockTasks} />);
      
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });

    test('shows empty state when no tasks', () => {
      render(<TasksList initialTasks={[]} />);
      
      expect(screen.getByText(/אין משימות/i)).toBeInTheDocument();
    });

    test('filters tasks correctly', () => {
      render(<TasksList initialTasks={mockTasks} />);
      
      // Initially should see all active tasks
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument(); // completed task hidden

      // Click on completed tab
      fireEvent.click(screen.getByRole('tab', { name: /הושלמו/i }));
      expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();

      // Click on all tab
      fireEvent.click(screen.getByRole('tab', { name: /הכל/i }));
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });

    test('calls toggle function when checkbox clicked', async () => {
      (tasksApi.toggleTaskCompletion as jest.Mock).mockResolvedValue({
        ...mockTasks[0],
        is_completed: true,
      });

      render(<TasksList initialTasks={mockTasks} userId="user123" />);
      
      const checkbox = screen.getByRole('checkbox', { checked: false });
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(tasksApi.toggleTaskCompletion).toHaveBeenCalledWith('1', true);
      });
    });
  });

  describe('TaskForm', () => {
    test('renders with empty form for new task', () => {
      render(<TaskForm />);
      
      expect(screen.getByLabelText(/שם המשימה/i)).toHaveValue('');
      expect(screen.getByLabelText(/פירוט/i)).toHaveValue('');
      expect(screen.getByText(/צרי משימה חדשה/i)).toBeInTheDocument();
    });

    test('fills form with task data when editing', () => {
      render(<TaskForm task={mockTasks[0]} />);
      
      expect(screen.getByLabelText(/שם המשימה/i)).toHaveValue('Test Task 1');
      expect(screen.getByLabelText(/פירוט/i)).toHaveValue('Test description 1');
      expect(screen.getByText(/עדכני משימה/i)).toBeInTheDocument();
    });

    test('calls API when submitting a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New description',
        subject: 'מדעים',
        type: TaskType.PERSONAL,
      };
      
      (tasksApi.createTask as jest.Mock).mockResolvedValue({
        id: '3',
        ...newTask,
        created_at: new Date().toISOString(),
      });
      
      const onSuccess = jest.fn();
      render(<TaskForm onSuccess={onSuccess} />);
      
      // Fill the form
      fireEvent.change(screen.getByLabelText(/שם המשימה/i), { target: { value: newTask.title } });
      fireEvent.change(screen.getByLabelText(/פירוט/i), { target: { value: newTask.description } });
      
      // Submit the form
      fireEvent.click(screen.getByText(/צרי משימה חדשה/i));
      
      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('TaskModal', () => {
    test('renders closed by default', () => {
      render(<TaskModal isOpen={false} onClose={() => {}} />);
      
      expect(screen.queryByText(/משימה חדשה/i)).not.toBeInTheDocument();
    });

    test('renders open with title for new task', () => {
      render(<TaskModal isOpen={true} onClose={() => {}} />);
      
      expect(screen.getByText(/משימה חדשה/i)).toBeInTheDocument();
    });

    test('renders with custom title when provided', () => {
      render(<TaskModal isOpen={true} onClose={() => {}} title="כותרת מיוחדת" />);
      
      expect(screen.getByText(/כותרת מיוחדת/i)).toBeInTheDocument();
    });
  });
}); 