export interface Activity {
  id?: string;
  userId?: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  hasAlert: boolean;
  color?: string;
  notificationId?: number;
}
