'use client';

import { useAdminTasks } from './lib/useAdminTasks';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

export default function AdminTasksPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useAdminTasks();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Tasks</h1>
      <p className="mt-1 text-sm text-ink/60">
        Create tasks users can complete for a wallet reward. Add a link and button label to send users somewhere first — leave
        them blank for a plain &quot;Complete&quot; button.
      </p>

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink">All Tasks</h2>
            <TaskForm onCreate={createTask} />
          </div>
          <TaskList
            tasks={tasks}
            onToggleActive={(id, active) => updateTask(id, { active })}
            onDelete={deleteTask}
          />
        </div>
      )}
    </div>
  );
}
