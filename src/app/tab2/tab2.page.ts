import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonLabel,
  NavController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, trashOutline, checkmarkDoneOutline, settingsOutline } from 'ionicons/icons';
import { Observable } from 'rxjs';
import { Task } from '../core/models/task.model';
import { DataService } from '../core/services/data.service';
import { IonButtons } from "@ionic/angular";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonButtons, 
    AsyncPipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonCheckbox,
    IonLabel
  ]
})
export class Tab2Page implements OnInit {
  private dataService = inject(DataService);
  private navCtrl = inject (NavController);

  tasks$!: Observable<Task[]>;
  newTaskTitle = '';

  constructor() {
    addIcons({settingsOutline,add,trashOutline,checkmarkDoneOutline});
  }

  ngOnInit() {
    this.tasks$ = this.dataService.getTasks();
  }

  /**
   * Agrega una nueva tarea a Firestore y limpia el campo de texto.
   */
  async addNewTask() {
    const title = this.newTaskTitle.trim();
    if (!title) return;

    await this.dataService.addTask({
      title,
      isCompleted: false
    });
    this.newTaskTitle = '';
  }

  irAAjustes() {
    this.navCtrl.navigateForward('/settings');
  }

  /**
   * Alterna el estado de completado de una tarea en Firestore.
   */
  async toggleCompletion(task: Task) {
    if (!task.id) return;
    await this.dataService.updateTask(task.id, {
      isCompleted: !task.isCompleted
    });
  }

  /**
   * Elimina una tarea por su ID.
   */
  async deleteTask(id?: string) {
    if (!id) return;
    await this.dataService.deleteTask(id);
  }
}
