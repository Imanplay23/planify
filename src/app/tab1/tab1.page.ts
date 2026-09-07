import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
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
  ModalController,
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  add,
  notificationsOutline,
  calendarOutline,
  settingsOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { Observable, BehaviorSubject, switchMap, map } from 'rxjs';
import { Activity } from '../core/models/activity.model';
import { DataService } from '../core/services/data.service';
import { ActivityModalComponent } from './activity-modal.component';
import { IonButton, IonButtons, NavController } from '@ionic/angular';
import { IonItemDivider } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonItemDivider,
    IonButtons,
    IonButton,
    AsyncPipe,
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
    IonLabel,
    CommonModule,
    DatePipe,
  ],
})
export class Tab1Page implements OnInit {
  private dataService = inject(DataService);
  private modalCtrl = inject(ModalController);
  private navCtrl = inject(NavController);

  // Variables de Estado
  currentDate = new Date();
  selectedView: string = 'day';
  displayDate: string = '';

  // Gatillo Reactivo: Avisa cuando cambia la vista o la fecha
  viewFilter$ = new BehaviorSubject<{ view: string; date: Date }>({
    view: 'day',
    date: new Date(),
  });

  // El observable final que lee el HTML
  groupedActivities$: Observable<any[]> | undefined;

  constructor() {
    addIcons({
      settingsOutline,
      chevronBackOutline,
      chevronForwardOutline,
      notificationsOutline,
      calendarOutline,
      add,
    });
  }

  ngOnInit() {
    this.updateDateDisplay();

    // Lógica Reactiva: Cuando el gatillo dispara, pide los datos y los filtra/agrupa
    this.groupedActivities$ = this.viewFilter$.pipe(
      switchMap((filter) => {
        return this.dataService.getActivities().pipe(
          map((activities) => {
            const filtradas = this.filterActivities(activities, filter.view, filter.date);
            return this.agruparPorFecha(filtradas);
          })
        );
      })
    );
  }

  // --- CONTROLES DE LA VISTA ---

  segmentChanged(event: any) {
    this.selectedView = event.detail.value;
    this.updateDateDisplay();
    // Disparamos el gatillo para que se actualice la lista
    this.viewFilter$.next({ view: this.selectedView, date: this.currentDate });
  }

  cambiarFecha(direccion: number) {
    const nuevaFecha = new Date(this.currentDate);

    if (this.selectedView === 'day') {
      nuevaFecha.setDate(nuevaFecha.getDate() + direccion);
    } else if (this.selectedView === 'week') {
      nuevaFecha.setDate(nuevaFecha.getDate() + direccion * 7);
    } else if (this.selectedView === 'month') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    }

    this.currentDate = nuevaFecha;
    this.updateDateDisplay();
    // Disparamos el gatillo con la nueva fecha
    this.viewFilter$.next({ view: this.selectedView, date: this.currentDate });
  }

  updateDateDisplay() {
    if (this.selectedView === 'day') {
      this.displayDate = this.currentDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (this.selectedView === 'week') {
      this.displayDate = 'Esta Semana';
    } else if (this.selectedView === 'month') {
      this.displayDate = this.currentDate.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      });
    }
  }

  // --- LÓGICA DE FILTRADO Y AGRUPACIÓN ---

  private filterActivities(activities: Activity[], view: string, referenceDate: Date): Activity[] {
    const targetYear = referenceDate.getFullYear();
    const targetMonth = referenceDate.getMonth();
    const targetDate = referenceDate.getDate();

    // Rango de la semana (Domingo a Sábado)
    const startOfWeek = new Date(referenceDate);
    startOfWeek.setDate(targetDate - referenceDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return activities.filter((activity) => {
      // Ajuste para la zona horaria
      const actDate = new Date(activity.date + 'T00:00:00');

      if (view === 'day') {
        return (
          actDate.getFullYear() === targetYear &&
          actDate.getMonth() === targetMonth &&
          actDate.getDate() === targetDate
        );
      }

      if (view === 'week') {
        return actDate >= startOfWeek && actDate <= endOfWeek;
      }

      if (view === 'month') {
        return (
          actDate.getFullYear() === targetYear &&
          actDate.getMonth() === targetMonth
        );
      }

      return true;
    });
  }

  private agruparPorFecha(activities: Activity[]) {
    activities.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.startTime).getTime();
      const dateB = new Date(b.date + 'T' + b.startTime).getTime();
      return dateA - dateB;
    });

    const grupos: any = {};
    activities.forEach((act) => {
      if (!grupos[act.date]) {
        grupos[act.date] = [];
      }
      grupos[act.date].push(act);
    });

    return Object.keys(grupos).map((fecha) => {
      return {
        fechaTexto: fecha,
        actividades: grupos[fecha],
      };
    });
  }

  // --- NAVEGACIÓN ---

  irAAjustes() {
    this.navCtrl.navigateForward('/settings');
  }

  async openModal() {
    const modal = await this.modalCtrl.create({
      component: ActivityModalComponent,
    });
    await modal.present();
  }
}