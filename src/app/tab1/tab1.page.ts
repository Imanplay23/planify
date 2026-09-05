import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, notificationsOutline } from 'ionicons/icons';
import { Activity } from '../core/models/activity.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon
  ],
})
export class Tab1Page {
  activities: Activity[] = [
    {
      id: '1',
      title: 'Reunión de Planificación de Sprint',
      description: 'Revisión de objetivos semanales, backlog y asignación de tareas del equipo.',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      hasAlert: true,
      color: '#3880ff'
    },
    {
      id: '2',
      title: 'Diseño de Arquitectura UI/UX',
      description: 'Definición de componentes visuales, línea de tiempo interactiva y paleta de colores.',
      date: new Date().toISOString().split('T')[0],
      startTime: '11:30',
      endTime: '13:00',
      hasAlert: false,
      color: '#2dd36f'
    },
    {
      id: '3',
      title: 'Revisión de Código y Despliegue',
      description: 'Code review de los servicios de Firebase y sincronización nativa con Capacitor.',
      date: new Date().toISOString().split('T')[0],
      startTime: '15:00',
      endTime: '16:30',
      hasAlert: true,
      color: '#eb445a'
    }
  ];

  constructor() {
    addIcons({ add, notificationsOutline });
  }
}
