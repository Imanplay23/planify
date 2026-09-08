export type TaskPriority = 'alta' | 'media' | 'baja';

export interface Task {
  id?: string;
  userId?: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;      // 'YYYY-MM-DD'
  dueTime?: string;      // 'HH:mm', opcional (si no se define, la alerta usa 09:00)
  listId?: string;
  priority?: TaskPriority;
  hasAlert?: boolean;
  notificationId?: number;
  createdAt?: string;
}
