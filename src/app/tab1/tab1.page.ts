import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  ModalController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, notificationsOutline, calendarOutline } from 'ionicons/icons';
import { Observable } from 'rxjs';
import { Activity } from '../core/models/activity.model';
import { DataService } from '../core/services/data.service';
import { ActivityModalComponent } from './activity-modal.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    AsyncPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon
  ],
})
export class Tab1Page implements OnInit {
  activities$!: Observable<Activity[]>;

  constructor(
    private dataService: DataService,
    private modalCtrl: ModalController
  ) {
    addIcons({ add, notificationsOutline, calendarOutline });
  }

  ngOnInit() {
    this.activities$ = this.dataService.getActivities();
  }

  /**
   * Abre el modal para agregar una nueva actividad directamente a Firestore.
   */
  async openModal() {
    const modal = await this.modalCtrl.create({
      component: ActivityModalComponent
    });
    await modal.present();
  }
}
