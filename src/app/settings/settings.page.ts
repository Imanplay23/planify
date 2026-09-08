import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import {
  IonButtons,
  IonBackButton,
  IonItem,
  IonList,
  IonIcon,
  IonToggle,
  IonLabel,
  IonInput,
  IonButton,
  AlertController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { moonOutline, trashOutline, add, listOutline } from 'ionicons/icons';
import { Observable } from 'rxjs';
import { DataService } from '../core/services/data.service';
import { TaskList } from '../core/models/task-list.model';
import { BRAND_COLORS } from '../core/constants/colors';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonInput,
    IonButton,
    IonLabel,
    IonToggle,
    IonIcon,
    IonList,
    IonItem,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class SettingsPage implements OnInit {
  private dataService = inject(DataService);
  private alertCtrl = inject(AlertController);

  isDarkMode = false;
  newListName = '';
  taskLists$!: Observable<TaskList[]>;

  constructor() {
    addIcons({ moonOutline, trashOutline, add, listOutline });
  }

  ngOnInit() {
    const prefersDark = localStorage.getItem('darkMode');
    if (prefersDark === 'true') {
      this.isDarkMode = true;
    }

    this.taskLists$ = this.dataService.getTaskLists();
  }

  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }

  /**
   * Crea una nueva lista de tareas, asignándole automáticamente el siguiente
   * color de la paleta de marca según cuántas listas existan ya.
   */
  async addTaskList(existingLists: TaskList[]) {
    const name = this.newListName.trim();
    if (!name) return;

    const color = BRAND_COLORS[existingLists.length % BRAND_COLORS.length];
    await this.dataService.addTaskList({
      name,
      color,
      createdAt: new Date().toISOString()
    });
    this.newListName = '';
  }

  async confirmDeleteList(list: TaskList) {
    if (!list.id) return;
    const alert = await this.alertCtrl.create({
      header: 'Eliminar lista',
      message: `¿Eliminar la lista "${list.name}"? Las tareas que la tenían asignada no se borran, solo quedan sin lista.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.dataService.deleteTaskList(list.id!)
        }
      ]
    });
    await alert.present();
  }
}
