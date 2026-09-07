import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  IonTextarea,
  IonToggle,
  IonSpinner,
  IonIcon,
  ModalController,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, checkmarkOutline } from 'ionicons/icons';
import { DataService } from '../core/services/data.service';
import { NotificationService } from '../core/services/notification.service';
import { Activity } from '../core/models/activity.model';

// Paleta acotada de colores para identificar actividades en la agenda
export const ACTIVITY_COLORS = [
  '#3880ff', // azul (primario)
  '#5260ff', // violeta
  '#2dd36f', // verde
  '#10dc60', // verde esmeralda
  '#ffc409', // amarillo
  '#ff9f43', // naranja
  '#eb445a', // rojo
  '#f56ab8', // rosado
];

@Component({
  selector: 'app-activity-modal',
  templateUrl: './activity-modal.component.html',
  styleUrls: ['./activity-modal.component.scss'],
  imports: [
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
    IonTextarea,
    IonToggle,
    IonSpinner,
    IonIcon,
  ]
})
export class ActivityModalComponent implements OnInit {
  // Cuando se abre en modo edición, se recibe la actividad existente vía componentProps
  @Input() activity: Activity | null = null;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private notificationService = inject(NotificationService);

  activityForm!: FormGroup;
  isLoading = false;
  isDeleting = false;
  colorOptions = ACTIVITY_COLORS;

  get isEditMode(): boolean {
    return !!this.activity?.id;
  }

  constructor() {
    addIcons({ trashOutline, checkmarkOutline });
  }

  ngOnInit() {
    // Solicitar permisos de notificación local al abrir el modal
    this.notificationService.requestPermissions();

    const today = new Date().toISOString().split('T')[0];
    const a = this.activity;

    this.activityForm = this.fb.group({
      title: [a?.title || '', [Validators.required]],
      description: [a?.description || ''],
      date: [a?.date || today, [Validators.required]],
      startTime: [a?.startTime || '09:00', [Validators.required]],
      endTime: [a?.endTime || '10:00', [Validators.required]],
      hasAlert: [a?.hasAlert || false],
      color: [a?.color || ACTIVITY_COLORS[0]]
    });
  }

  seleccionarColor(color: string) {
    this.activityForm.get('color')?.setValue(color);
  }

  async save() {
    if (this.activityForm.invalid || this.isLoading || this.isDeleting) {
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.activityForm.value;
      const activityData = {
        title: formValue.title.trim(),
        description: (formValue.description || '').trim(),
        date: formValue.date,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        hasAlert: Boolean(formValue.hasAlert),
        color: formValue.color || ACTIVITY_COLORS[0]
      };

      if (this.isEditMode && this.activity?.id) {
        await this.updateExisting(this.activity.id, activityData);
      } else {
        await this.createNew(activityData);
      }
    } catch (error) {
      console.error('Error al guardar la actividad en Firestore:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async createNew(activityData: Omit<Activity, 'id' | 'notificationId'>) {
    const docRef = await this.dataService.addActivity(activityData);
    let notificationId: number | undefined;

    if (activityData.hasAlert) {
      notificationId = await this.notificationService.scheduleActivityNotification({
        id: docRef.id,
        ...activityData
      });
      if (notificationId) {
        await this.dataService.updateActivity(docRef.id, { notificationId });
      }
    }

    await this.modalCtrl.dismiss({ id: docRef.id, ...activityData, notificationId }, 'created');
  }

  private async updateExisting(id: string, activityData: Omit<Activity, 'id' | 'notificationId'>) {
    const previousNotificationId = this.activity?.notificationId;

    // La alerta anterior siempre se cancela; si sigue activa, se reprograma
    // con la fecha/hora/título posiblemente nuevos.
    await this.notificationService.cancelNotification(previousNotificationId);

    let notificationId: number | undefined;
    if (activityData.hasAlert) {
      notificationId = await this.notificationService.scheduleActivityNotification({
        id,
        ...activityData
      });
    }

    await this.dataService.updateActivity(id, { ...activityData, notificationId: notificationId ?? null as any });
    await this.modalCtrl.dismiss({ id, ...activityData, notificationId }, 'updated');
  }

  async confirmDelete() {
    if (!this.activity?.id || this.isLoading || this.isDeleting) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar actividad',
      message: `¿Seguro que quieres eliminar "${this.activity.title}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteActivity()
        }
      ]
    });
    await alert.present();
  }

  private async deleteActivity() {
    if (!this.activity?.id) return;
    this.isDeleting = true;
    try {
      await this.notificationService.cancelNotification(this.activity.notificationId);
      await this.dataService.deleteActivity(this.activity.id);
      await this.modalCtrl.dismiss({ id: this.activity.id }, 'deleted');
    } catch (error) {
      console.error('Error al eliminar la actividad:', error);
    } finally {
      this.isDeleting = false;
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}