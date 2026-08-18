'use client'

import { TaskCard } from './TaskCard'
import { useTasks } from './TasksProvider'
import { CheckCircle } from 'lucide-react'

export function TaskList() {
  const { tasks, filteredTasks } = useTasks()

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="size-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="size-7 text-muted-foreground" />
        </div>
        <h3 className="font-medium">No tasks found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {tasks.length === 0
            ? 'Create your first task to get started'
            : 'Try adjusting your filters'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
