import { Injectable } from '@angular/core';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Activity } from '../models/activity.model';

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
   */
  async scheduleActivityNotification(activity: Activity): Promise<void> {
    try {
      // Combinar activity.date (YYYY-MM-DD) y activity.startTime (HH:mm)
      const dateParts = activity.date.split('-');
      const timeParts = activity.startTime.split(':');

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
            title: `Recordatorio: ${activity.title}`,
            body: activity.description || '¡Tienes una actividad programada en tu agenda!',
            schedule: {
              at: targetDate,
              allowWhileIdle: true
            }
          }
        ]
      });

      console.log(`Notificación programada exitosamente para "${activity.title}" a las ${targetDate.toLocaleString()}`);
    } catch (error) {
      console.error('Error al programar la notificación local:', error);
    }
  }
}
