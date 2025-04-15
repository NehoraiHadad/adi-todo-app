'use client';

import { useState } from 'react';
import { Task, TaskType } from '@/types';
import { useAppStore } from '@/store';

// Icons for subjects
const subjectIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  'חשבון': { icon: '📏', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  'אנגלית': { icon: '🔤', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'מדעים': { icon: '🌱', color: 'text-green-700', bgColor: 'bg-green-100' },
  'עברית': { icon: '📚', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  'אמנות': { icon: '🎨', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  'ספורט': { icon: '⚽', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  'מוזיקה': { icon: '🎵', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'תנ"ך': { icon: '📖', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  'היסטוריה': { icon: '🏛️', color: 'text-red-700', bgColor: 'bg-red-100' },
  'גיאוגרפיה': { icon: '🌍', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
};

// Get icon and colors for a subject
const getSubjectStyle = (subject: string) => {
  return subjectIcons[subject] || { icon: '📝', color: 'text-gray-700', bgColor: 'bg-gray-100' };
};

// Dummy tasks data
const initialTasks: Task[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    assigned_date: new Date().toISOString(),
    subject: 'חשבון',
    description: 'להכין שיעורי בית בחשבון - עמודים 25-26',
    type: TaskType.CLASS,
    completed: false,
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    assigned_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    subject: 'אנגלית',
    description: 'לקרוא פרק 3 בספר',
    type: TaskType.CLASS,
    completed: false,
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    assigned_date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    subject: 'מדעים',
    description: 'להכין דגם של מערכת השמש',
    type: TaskType.PERSONAL,
    completed: true,
  },
  {
    id: '4',
    created_at: new Date().toISOString(),
    assigned_date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    subject: 'עברית',
    description: 'לסיים את התרגיל בעמוד 42',
    type: TaskType.CLASS,
    completed: true,
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    subject: '',
    description: '',
    type: TaskType.CLASS,
    completed: false,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showTaskCompletion, setShowTaskCompletion] = useState<string | null>(null);
  
  const addTask = () => {
    if (!newTask.subject || !newTask.description) return;
    
    const task: Task = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      assigned_date: new Date().toISOString(),
      subject: newTask.subject || '',
      description: newTask.description || '',
      type: newTask.type || TaskType.CLASS,
      completed: false,
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      subject: '',
      description: '',
      type: TaskType.CLASS,
      completed: false,
    });
    setShowAddModal(false);
  };
  
  const toggleTaskStatus = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const newStatus = !task.completed;
          if (newStatus) {
            setShowTaskCompletion(id);
            setTimeout(() => setShowTaskCompletion(null), 2000);
          }
          return { ...task, completed: newStatus };
        }
        return task;
      })
    );
  };
  
  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };
  
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'numeric',
    }).format(date);
  };
  
  const getIsOverdue = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };
  
  const getTaskBgColor = (task: Task) => {
    if (task.completed) return 'bg-green-50 border-2 border-green-200';
    if (getIsOverdue(task.assigned_date)) return 'bg-red-50 border-2 border-red-200';
    return 'bg-white border-2 border-indigo-100';
  };
  
  return (
    <div className="container-app py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-600 flex items-center">
          <span className="text-3xl mr-2">✏️</span>
          המשימות שלי
        </h1>
        <button
          className="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 flex items-center"
          onClick={() => setShowAddModal(true)}
        >
          <span className="text-xl mr-1">+</span>
          משימה חדשה
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex mb-6 bg-indigo-100 rounded-full p-1 shadow-inner">
        <button
          className={`py-2 px-6 font-medium rounded-full transition-all ${
            filter === 'all'
              ? 'bg-white text-indigo-700 shadow'
              : 'text-indigo-600 hover:bg-indigo-200'
          }`}
          onClick={() => setFilter('all')}
        >
          הכל
        </button>
        <button
          className={`py-2 px-6 font-medium rounded-full transition-all ${
            filter === 'active'
              ? 'bg-white text-indigo-700 shadow'
              : 'text-indigo-600 hover:bg-indigo-200'
          }`}
          onClick={() => setFilter('active')}
        >
          פעילות
        </button>
        <button
          className={`py-2 px-6 font-medium rounded-full transition-all ${
            filter === 'completed'
              ? 'bg-white text-indigo-700 shadow'
              : 'text-indigo-600 hover:bg-indigo-200'
          }`}
          onClick={() => setFilter('completed')}
        >
          הושלמו
        </button>
      </div>
      
      {/* Tasks List */}
      <div className="space-y-4 mb-16">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl">אין משימות {filter === 'active' ? 'פעילות' : filter === 'completed' ? 'שהושלמו' : ''}</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const subjectStyle = getSubjectStyle(task.subject);
            return (
              <div key={task.id} className={`card rounded-xl shadow-md overflow-hidden ${getTaskBgColor(task)} relative`}>
                {showTaskCompletion === task.id && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center text-white z-10 animate-pulse">
                    <div className="text-center">
                      <div className="text-5xl mb-2">🎉</div>
                      <p className="text-2xl font-bold">כל הכבוד!</p>
                      <p>השלמת את המשימה</p>
                    </div>
                  </div>
                )}
                <div className="flex p-4">
                  <div className="pt-1">
                    <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center border-2 border-indigo-300 cursor-pointer group-hover:bg-indigo-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskStatus(task.id)}
                        className="opacity-0 absolute cursor-pointer w-6 h-6"
                        id={`task-${task.id}`}
                      />
                      {task.completed && (
                        <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ms-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className={`p-1 rounded-md text-lg ${subjectStyle.bgColor} mr-2`}>
                          <span role="img" aria-label={task.subject}>{subjectStyle.icon}</span>
                        </div>
                        <h3 className={`font-medium text-lg ${task.completed ? 'line-through text-gray-500' : subjectStyle.color}`}>
                          {task.subject}
                        </h3>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            getIsOverdue(task.assigned_date) && !task.completed
                              ? 'bg-red-100 text-red-700'
                              : task.completed 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {getIsOverdue(task.assigned_date) && !task.completed
                            ? '❗ באיחור'
                            : task.completed
                              ? '✓ הושלם'
                              : `📅 עד ${formatDate(task.assigned_date)}`}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="ms-2 text-gray-400 hover:text-red-500 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className={`text-md mt-2 ${task.completed && 'line-through text-gray-500'}`}>
                      {task.description}
                    </p>
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        task.type === TaskType.PERSONAL 
                          ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {task.type === TaskType.PERSONAL 
                          ? '👤 אישי' 
                          : '👨‍👩‍👧‍👦 כיתתי'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-4 border-indigo-200">
            <h2 className="text-xl font-bold mb-4 text-indigo-600 flex items-center">
              <span className="text-2xl mr-2">✏️</span>
              הוספת משימה חדשה
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-indigo-700 mb-1">
                  מקצוע
                </label>
                <input
                  type="text"
                  id="subject"
                  placeholder="למשל: חשבון, אנגלית, מדעים..."
                  value={newTask.subject}
                  onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-indigo-700 mb-1">
                  תיאור המשימה
                </label>
                <textarea
                  id="description"
                  placeholder="תיאור מפורט של המשימה..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-1">
                  סוג המשימה
                </label>
                <div className="flex space-x-4 space-x-reverse">
                  <label className="inline-flex items-center bg-blue-50 p-3 rounded-lg border-2 border-blue-200 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={newTask.type === TaskType.CLASS}
                      onChange={() => setNewTask({ ...newTask, type: TaskType.CLASS })}
                      className="h-4 w-4 text-blue-600 border-blue-300"
                    />
                    <span className="ms-2 font-medium text-blue-700">👨‍👩‍👧‍👦 כיתתי</span>
                  </label>
                  <label className="inline-flex items-center bg-purple-50 p-3 rounded-lg border-2 border-purple-200 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={newTask.type === TaskType.PERSONAL}
                      onChange={() => setNewTask({ ...newTask, type: TaskType.PERSONAL })}
                      className="h-4 w-4 text-purple-600 border-purple-300"
                    />
                    <span className="ms-2 font-medium text-purple-700">👤 אישי</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
              <button
                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center"
                onClick={() => setShowAddModal(false)}
              >
                <span className="mr-1">↩️</span>
                ביטול
              </button>
              <button
                className="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 flex items-center"
                onClick={addTask}
              >
                <span className="mr-1">✅</span>
                הוסף משימה
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add extra padding for mobile bottom nav */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
} 