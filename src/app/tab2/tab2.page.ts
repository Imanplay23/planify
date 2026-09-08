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
  IonButtons,
  ModalController,
  NavController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmarkDoneOutline, settingsOutline } from 'ionicons/icons';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../core/models/task.model';
import { TaskList } from '../core/models/task-list.model';
import { DataService } from '../core/services/data.service';
import { TaskModalComponent } from './task-modal.component';

export interface TaskViewModel extends Task {
  listColor?: string;
  listName?: string;
  isOverdue: boolean;
}

interface TasksViewData {
  tasks: TaskViewModel[];
  lists: TaskList[];
  filter: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    IonButtons,
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
  private modalCtrl = inject(ModalController);
  private navCtrl = inject(NavController);

  newTaskTitle = '';
  private filterSubject = new BehaviorSubject<string>('all');
  viewData$!: Observable<TasksViewData>;

  constructor() {
    addIcons({ settingsOutline, add, checkmarkDoneOutline });
  }

  ngOnInit() {
    this.viewData$ = combineLatest([
      this.dataService.getTasks(),
      this.dataService.getTaskLists(),
      this.filterSubject
    ]).pipe(
      map(([tasks, lists, filter]) => {
        const todayKey = this.todayKey();
        const withMeta: TaskViewModel[] = tasks.map((t) => ({
          ...t,
          listColor: t.listId ? lists.find((l) => l.id === t.listId)?.color : undefined,
          listName: t.listId ? lists.find((l) => l.id === t.listId)?.name : undefined,
          isOverdue: !!t.dueDate && !t.isCompleted && t.dueDate < todayKey
        }));

        const filtered =
          filter === 'all'
            ? withMeta
            : filter === 'none'
              ? withMeta.filter((t) => !t.listId)
              : withMeta.filter((t) => t.listId === filter);

        return { tasks: filtered, lists, filter };
      })
    );
  }

  setFilter(value: string) {
    this.filterSubject.next(value);
  }

  private todayKey(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Agrega una nueva tarea a Firestore y limpia el campo de texto.
   * La creación rápida solo captura el título; el resto (fecha, lista,
   * prioridad, alerta) se agrega editando la tarea después.
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
   * Abre el modal de edición completa de la tarea (fecha, lista, prioridad,
   * alerta, y la opción de eliminarla).
   */
  async openTaskModal(task: Task) {
    const modal = await this.modalCtrl.create({
      component: TaskModalComponent,
      componentProps: { task }
    });
    await modal.present();
  }
}
