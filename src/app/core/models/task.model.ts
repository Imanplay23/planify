export interface Task {
  id?: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  listId?: string;
}
