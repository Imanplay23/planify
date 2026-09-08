import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonToggle,
  IonSpinner,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  ModalController,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { Observable } from 'rxjs';
import { DataService } from '../core/services/data.service';
import { NotificationService } from '../core/services/notification.service';
import { Task, TaskPriority } from '../core/models/task.model';
import { TaskList } from '../core/models/task-list.model';

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss'],
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonToggle,
    IonSpinner,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSelect,
    IonSelectOption,
  ]
})
export class TaskModalComponent implements OnInit {
  // La tarea que se está editando (siempre existe: este modal es solo de edición,
  // la creación rápida de tareas se hace desde el campo de texto en Tareas).
  @Input({ required: true }) task!: Task;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private notificationService = inject(NotificationService);

  taskForm!: FormGroup;
  taskLists$: Observable<TaskList[]>;
  isLoading = false;
  isDeleting = false;

  constructor() {
    addIcons({ trashOutline });
    this.taskLists$ = this.dataService.getTaskLists();
  }

  ngOnInit() {
    this.taskForm = this.fb.group({
      title: [this.task.title, [Validators.required]],
      listId: [this.task.listId || ''],
      dueDate: [this.task.dueDate || ''],
      dueTime: [this.task.dueTime || ''],
      priority: [this.task.priority || 'media'],
      hasAlert: [this.task.hasAlert || false]
    });
  }

  seleccionarPrioridad(priority: string | number | undefined) {
    if (!priority) return;
    this.taskForm.get('priority')?.setValue(priority as TaskPriority);
  }

  quitarFecha() {
    this.taskForm.patchValue({ dueDate: '', dueTime: '', hasAlert: false });
  }

  async save() {
    if (this.taskForm.invalid || this.isLoading || this.isDeleting || !this.task.id) return;

    this.isLoading = true;
    try {
      const formValue = this.taskForm.value;
      const hasDueDate = !!formValue.dueDate;

      const taskData: Partial<Task> = {
        title: formValue.title.trim(),
        listId: formValue.listId || null as any,
        dueDate: hasDueDate ? formValue.dueDate : null as any,
        dueTime: hasDueDate && formValue.dueTime ? formValue.dueTime : null as any,
        priority: formValue.priority,
        // La alerta solo tiene sentido si hay fecha límite
        hasAlert: hasDueDate ? Boolean(formValue.hasAlert) : false
      };

      // Cancelar cualquier notificación previa: cambió la fecha, hora o se desactivó la alerta
      await this.notificationService.cancelNotification(this.task.notificationId);

      let notificationId: number | undefined;
      if (taskData.hasAlert) {
        notificationId = await this.notificationService.scheduleTaskNotification({
          ...this.task,
          ...taskData
        } as Task);
      }
      taskData.notificationId = notificationId ?? null as any;

      await this.dataService.updateTask(this.task.id, taskData);
      await this.modalCtrl.dismiss({ ...this.task, ...taskData }, 'updated');
    } catch (error) {
      console.error('Error al guardar la tarea en Firestore:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async confirmDelete() {
    if (!this.task.id || this.isLoading || this.isDeleting) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar tarea',
      message: `¿Seguro que quieres eliminar "${this.task.title}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteTask()
        }
      ]
    });
    await alert.present();
  }

  private async deleteTask() {
    if (!this.task.id) return;
    this.isDeleting = true;
    try {
      await this.notificationService.cancelNotification(this.task.notificationId);
      await this.dataService.deleteTask(this.task.id);
      await this.modalCtrl.dismiss({ id: this.task.id }, 'deleted');
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
    } finally {
      this.isDeleting = false;
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
