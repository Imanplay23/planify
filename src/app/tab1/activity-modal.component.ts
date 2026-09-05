import { Component, OnInit, inject } from '@angular/core';
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
  ModalController
} from '@ionic/angular';
import { DataService } from '../core/services/data.service';

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
    IonSpinner
  ]
})
export class ActivityModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private dataService = inject(DataService);

  activityForm!: FormGroup;
  isLoading = false;

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.activityForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      date: [today, [Validators.required]],
      startTime: ['09:00', [Validators.required]],
      endTime: ['10:00', [Validators.required]],
      hasAlert: [false],
      color: ['#3880ff']
    });
  }

  async save() {
    if (this.activityForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.activityForm.value;
      const newActivity = {
        title: formValue.title.trim(),
        description: (formValue.description || '').trim(),
        date: formValue.date,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        hasAlert: Boolean(formValue.hasAlert),
        color: formValue.color || '#3880ff'
      };

      const docRef = await this.dataService.addActivity(newActivity);
      await this.modalCtrl.dismiss({ id: docRef.id, ...newActivity }, 'created');
    } catch (error) {
      console.error('Error al guardar la actividad en Firestore:', error);
    } finally {
      this.isLoading = false;
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
