import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ModalController
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, notificationsOutline, calendarOutline } from 'ionicons/icons';
import { Observable, map } from 'rxjs';
import { Activity } from '../core/models/activity.model';
import { DataService } from '../core/services/data.service';
import { ActivityModalComponent } from './activity-modal.component';

type SegmentView = 'dia' | 'semana' | 'mes';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    AsyncPipe,
    DatePipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel
  ],
})
export class Tab1Page implements OnInit {
  private dataService = inject(DataService);
  private modalCtrl = inject(ModalController);

  currentDate = new Date();
  selectedSegment: SegmentView = 'dia';
  activities$!: Observable<Activity[]>;
  filteredActivities$!: Observable<Activity[]>;

  constructor() {
    addIcons({ add, notificationsOutline, calendarOutline });
  }

  ngOnInit() {
    this.activities$ = this.dataService.getActivities();
    this.applyFilter();
  }

  onSegmentChange(value: SegmentView) {
    this.selectedSegment = value;
    this.applyFilter();
  }

  private applyFilter() {
    const today = this.currentDate;
    this.filteredActivities$ = this.activities$.pipe(
      map((activities: Activity[]) => {
        if (this.selectedSegment === 'dia') {
          const todayStr = this.toLocalDateString(today);
          return activities.filter(a => a.date === todayStr);
        }
        if (this.selectedSegment === 'semana') {
          const { start, end } = this.getWeekRange(today);
          return activities.filter(a => {
            const d = new Date(a.date + 'T00:00:00');
            return d >= start && d <= end;
          });
        }
        // mes
        return activities.filter(a => {
          const d = new Date(a.date + 'T00:00:00');
          return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
        });
      })
    );
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getWeekRange(date: Date): { start: Date; end: Date } {
    const day = date.getDay(); // 0 = domingo
    const start = new Date(date);
    start.setDate(date.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
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

