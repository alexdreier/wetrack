'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { GripVertical, CheckCircle } from 'lucide-react'
import { TaskWithAssignee } from '@/types/database'
import { TaskCard } from './TaskCard'
import { useTasks } from './TasksProvider'
import { cn } from '@/lib/utils'

function SortableTaskCard({ task }: { task: TaskWithAssignee }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group/drag relative', isDragging && 'z-10')}
    >
      <TaskCard
        task={task}
        className={cn(isDragging && 'shadow-lg border-muted-foreground/40')}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="flex items-center self-stretch pl-1.5 -mr-2 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none opacity-40 sm:opacity-0 sm:group-hover/drag:opacity-100 focus-visible:opacity-100 transition-opacity outline-none"
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  )
}

export function TaskList() {
  const { tasks, filteredTasks, filters, reorderTask } = useTasks()
  const canReorder = filters.sort === 'manual'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTask(String(active.id), String(over.id))
    }
  }

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

  if (!canReorder) {
    return (
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
