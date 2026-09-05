import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Activity } from '../models/activity.model';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(private firestore: Firestore) {}

  private get activitiesCollection() {
    return collection(this.firestore, 'activities');
  }

  private get tasksCollection() {
    return collection(this.firestore, 'tasks');
  }

  // ==================== ACTIVITIES CRUD ====================

  /**
   * Obtiene todas las actividades en tiempo real ordenadas por hora de inicio.
   */
  getActivities(): Observable<Activity[]> {
    const activitiesQuery = query(this.activitiesCollection, orderBy('startTime', 'asc'));
    return (collectionData(activitiesQuery, { idField: 'id' }) as Observable<Activity[]>).pipe(
      tap((data) => console.log('Datos de Firestore:', data)),
      map(activities =>
        [...activities].sort((a, b) => {
          const dateComp = (a.date || '').localeCompare(b.date || '');
          if (dateComp !== 0) return dateComp;
          return (a.startTime || '').localeCompare(b.startTime || '');
        })
      )
    );
  }

  /**
   * Obtiene una actividad específica por su ID.
   */
  getActivityById(id: string): Observable<Activity | undefined> {
    const activityDocRef = doc(this.firestore, `activities/${id}`);
    return docData(activityDocRef, { idField: 'id' }) as Observable<Activity | undefined>;
  }

  /**
   * Agrega una nueva actividad a Firestore.
   */
  addActivity(activity: Omit<Activity, 'id'>): Promise<DocumentReference> {
    return addDoc(this.activitiesCollection, activity);
  }

  /**
   * Actualiza una actividad existente.
   */
  updateActivity(id: string, activity: Partial<Activity>): Promise<void> {
    const activityDocRef = doc(this.firestore, `activities/${id}`);
    const dataToUpdate = { ...activity };
    delete dataToUpdate.id;
    return updateDoc(activityDocRef, dataToUpdate as { [x: string]: any });
  }

  /**
   * Elimina una actividad por su ID.
   */
  deleteActivity(id: string): Promise<void> {
    const activityDocRef = doc(this.firestore, `activities/${id}`);
    return deleteDoc(activityDocRef);
  }

  // ==================== TASKS CRUD ====================

  /**
   * Obtiene todas las tareas en tiempo real.
   */
  getTasks(): Observable<Task[]> {
    return collectionData(this.tasksCollection, { idField: 'id' }) as Observable<Task[]>;
  }

  /**
   * Obtiene una tarea específica por su ID.
   */
  getTaskById(id: string): Observable<Task | undefined> {
    const taskDocRef = doc(this.firestore, `tasks/${id}`);
    return docData(taskDocRef, { idField: 'id' }) as Observable<Task | undefined>;
  }

  /**
   * Agrega una nueva tarea a Firestore.
   */
  addTask(task: Omit<Task, 'id'>): Promise<DocumentReference> {
    return addDoc(this.tasksCollection, task);
  }

  /**
   * Actualiza una tarea existente.
   */
  updateTask(id: string, task: Partial<Task>): Promise<void> {
    const taskDocRef = doc(this.firestore, `tasks/${id}`);
    const dataToUpdate = { ...task };
    delete dataToUpdate.id;
    return updateDoc(taskDocRef, dataToUpdate as { [x: string]: any });
  }

  /**
   * Elimina una tarea por su ID.
   */
  deleteTask(id: string): Promise<void> {
    const taskDocRef = doc(this.firestore, `tasks/${id}`);
    return deleteDoc(taskDocRef);
  }
}
