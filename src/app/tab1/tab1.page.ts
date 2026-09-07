import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
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

// Una celda de día dentro de la cuadrícula de mes o la tira de semana
export interface DayCell {
  date: Date;
  dateKey: string; // 'YYYY-MM-DD'
  dayNumber: number;
  weekdayShort: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasActivities: boolean;
  activityCount: number;
}

interface ViewState {
  view: string;
  currentDate: Date;
  selectedDate: Date;
}

interface ViewData {
  view: string;
  monthGrid: DayCell[][] | null;
  weekStrip: DayCell[] | null;
  focusedDateKey: string;
  focusedDateLabel: string;
  dayActivities: Activity[];
}

const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
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
  weekdaysShort = WEEKDAYS_SHORT;

  // Gatillo Reactivo: Avisa cuando cambia la vista, la fecha de referencia o el día seleccionado
  private state$ = new BehaviorSubject<ViewState>({
    view: 'day',
    currentDate: new Date(),
    selectedDate: new Date(),
  });

  // El observable final que lee el HTML
  viewData$: Observable<ViewData> | undefined;

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

    this.viewData$ = this.state$.pipe(
      switchMap((state) =>
        this.dataService.getActivities().pipe(
          map((activities) => this.computeViewData(activities, state))
        )
      )
    );
  }

  // --- CONTROLES DE LA VISTA ---

  segmentChanged(event: any) {
    this.selectedView = event.detail.value;
    this.updateDateDisplay();
    this.emitState();
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
    // Al navegar, el día "enfocado" vuelve a coincidir con la nueva fecha de referencia
    this.updateDateDisplay();
    this.emitState(nuevaFecha);
  }

  /**
   * Selecciona un día dentro de la cuadrícula de mes o la tira de semana.
   * Si el día pertenece a otro mes (celdas grises del calendario), también
   * recentra la vista en ese mes para que la cuadrícula tenga sentido.
   */
  seleccionarDia(cell: DayCell) {
    if (this.selectedView === 'month' && !cell.inCurrentMonth) {
      this.currentDate = new Date(cell.date);
      this.updateDateDisplay();
    }
    this.emitState(cell.date);
  }

  private emitState(selectedDate?: Date) {
    this.state$.next({
      view: this.selectedView,
      currentDate: this.currentDate,
      selectedDate: selectedDate ?? this.currentDate,
    });
  }

  updateDateDisplay() {
    if (this.selectedView === 'day') {
      this.displayDate = this.currentDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (this.selectedView === 'week') {
      const start = this.startOfWeek(this.currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sameMonth = start.getMonth() === end.getMonth();
      const startLabel = start.toLocaleDateString('es-ES', { day: 'numeric', month: sameMonth ? undefined : 'short' });
      const endLabel = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      this.displayDate = `${startLabel} - ${endLabel}`;
    } else if (this.selectedView === 'month') {
      this.displayDate = this.currentDate.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      });
    }
  }

  // --- CONSTRUCCIÓN DE LA CUADRÍCULA / DATOS DE VISTA ---

  private computeViewData(activities: Activity[], state: ViewState): ViewData {
    const activitiesByDate = this.groupActivitiesByDateKey(activities);

    let monthGrid: DayCell[][] | null = null;
    let weekStrip: DayCell[] | null = null;
    let focusedDate: Date;

    if (state.view === 'month') {
      monthGrid = this.buildMonthGrid(activitiesByDate, state.currentDate, state.selectedDate);
      focusedDate = state.selectedDate;
    } else if (state.view === 'week') {
      weekStrip = this.buildWeekStrip(activitiesByDate, state.currentDate, state.selectedDate);
      focusedDate = state.selectedDate;
    } else {
      focusedDate = state.currentDate;
    }

    const focusedDateKey = this.toDateKey(focusedDate);
    const dayActivities = (activitiesByDate[focusedDateKey] || []).slice().sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || '')
    );

    return {
      view: state.view,
      monthGrid,
      weekStrip,
      focusedDateKey,
      focusedDateLabel: focusedDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      dayActivities,
    };
  }

  private buildMonthGrid(
    activitiesByDate: Record<string, Activity[]>,
    referenceDate: Date,
    selectedDate: Date
  ): DayCell[][] {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const gridStart = this.startOfWeek(firstOfMonth);

    const weeks: DayCell[][] = [];
    const cursor = new Date(gridStart);

    for (let w = 0; w < 6; w++) {
      const week: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(this.buildDayCell(cursor, activitiesByDate, selectedDate, cursor.getMonth() === month));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  }

  private buildWeekStrip(
    activitiesByDate: Record<string, Activity[]>,
    referenceDate: Date,
    selectedDate: Date
  ): DayCell[] {
    const start = this.startOfWeek(referenceDate);
    const days: DayCell[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(this.buildDayCell(d, activitiesByDate, selectedDate, true));
    }

    return days;
  }

  private buildDayCell(
    date: Date,
    activitiesByDate: Record<string, Activity[]>,
    selectedDate: Date,
    inCurrentMonth: boolean
  ): DayCell {
    const dateKey = this.toDateKey(date);
    const dayActivities = activitiesByDate[dateKey] || [];
    return {
      date: new Date(date),
      dateKey,
      dayNumber: date.getDate(),
      weekdayShort: WEEKDAYS_SHORT[date.getDay()],
      inCurrentMonth,
      isToday: this.isSameDay(date, new Date()),
      isSelected: this.isSameDay(date, selectedDate),
      hasActivities: dayActivities.length > 0,
      activityCount: dayActivities.length,
    };
  }

  private groupActivitiesByDateKey(activities: Activity[]): Record<string, Activity[]> {
    const map: Record<string, Activity[]> = {};
    activities.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }

  private startOfWeek(date: Date): Date {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // --- NAVEGACIÓN ---

  irAAjustes() {
    this.navCtrl.navigateForward('/settings');
  }

  async openModal(activity?: Activity) {
    const modal = await this.modalCtrl.create({
      component: ActivityModalComponent,
      componentProps: activity ? { activity } : undefined,
    });
    await modal.present();
  }
}