import { Injectable } from '@angular/core';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Activity } from '../models/activity.model';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  /**
   * Solicita permisos de notificaciones locales al usuario.
   */
  async requestPermissions(): Promise<PermissionStatus> {
    try {
      return await LocalNotifications.requestPermissions();
    } catch (error) {
      console.warn('Error al solicitar permisos de notificaciones locales:', error);
      return { display: 'denied' };
    }
  }

  /**
   * Programa una alerta local para la actividad en su fecha y hora programada.
   * Devuelve el id de la notificación programada, para poder cancelarla o
   * reprogramarla más adelante si la actividad se edita o elimina.
   */
  async scheduleActivityNotification(activity: Activity): Promise<number | undefined> {
    return this.scheduleNotification({
      date: activity.date,
      time: activity.startTime,
      title: `Recordatorio: ${activity.title}`,
      body: activity.description || '¡Tienes una actividad programada en tu agenda!'
    });
  }

  /**
   * Programa una alerta local para una tarea con fecha límite. Si la tarea no
   * tiene hora definida (dueTime), usa las 09:00 del día de la fecha límite.
   */
  async scheduleTaskNotification(task: Task): Promise<number | undefined> {
    if (!task.dueDate) return undefined;
    return this.scheduleNotification({
      date: task.dueDate,
      time: task.dueTime || '09:00',
      title: `Tarea pendiente: ${task.title}`,
      body: 'Se acerca la fecha límite de esta tarea.'
    });
  }

  /**
   * Lógica compartida de programación: combina una fecha (YYYY-MM-DD) y hora
   * (HH:mm), genera un id válido para Capacitor y programa la notificación.
   */
  private async scheduleNotification(params: {
    date: string;
    time: string;
    title: string;
    body: string;
  }): Promise<number | undefined> {
    try {
      const dateParts = params.date.split('-');
      const timeParts = params.time.split(':');

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Mes indexado en 0
      const day = parseInt(dateParts[2], 10);
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);

      const scheduleDate = new Date(year, month, day, hours, minutes, 0);

      // Si la fecha y hora programada ya expiró, programar una alerta rápida de confirmación
      const targetDate = scheduleDate.getTime() > Date.now()
        ? scheduleDate
        : new Date(Date.now() + 5000);

      // Generar un ID numérico entero de 32 bits válido para Capacitor
      const notificationId = Math.floor(Math.random() * 2147483647);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: params.title,
            body: params.body,
            schedule: {
              at: targetDate,
              allowWhileIdle: true
            }
          }
        ]
      });

      console.log(`Notificación programada exitosamente: "${params.title}" a las ${targetDate.toLocaleString()}`);
      return notificationId;
    } catch (error) {
      console.error('Error al programar la notificación local:', error);
      return undefined;
    }
  }

  /**
   * Cancela una notificación local previamente programada (por ejemplo, al
   * editar una actividad/tarea y desactivar su alerta, o al eliminarla).
   */
  async cancelNotification(notificationId?: number): Promise<void> {
    if (!notificationId) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.warn('Error al cancelar la notificación local:', error);
    }
  }
}
