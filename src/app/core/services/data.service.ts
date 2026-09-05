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
   * Obtiene todas las tareas en tiempo real ordenadas por fecha de creación (más recientes primero).
   */
  getTasks(): Observable<Task[]> {
    return (collectionData(this.tasksCollection, { idField: 'id' }) as Observable<Task[]>).pipe(
      map(tasks =>
        [...tasks].sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        )
      )
    );
  }

  /**
   * Obtiene una tarea específica por su ID.
   */
  getTaskById(id: string): Observable<Task | undefined> {
    const taskDocRef = doc(this.firestore, `tasks/${id}`);
    return docData(taskDocRef, { idField: 'id' }) as Observable<Task | undefined>;
  }

  /**
   * Agrega una nueva tarea a Firestore con fecha de creación automática si no se provee.
   */
  addTask(task: Omit<Task, 'id'> | Task): Promise<DocumentReference> {
    const taskData: Omit<Task, 'id'> = {
      title: task.title,
      isCompleted: Boolean(task.isCompleted),
      createdAt: task.createdAt || new Date().toISOString()
    };
    if (task.dueDate) taskData.dueDate = task.dueDate;
    if (task.listId) taskData.listId = task.listId;

    return addDoc(this.tasksCollection, taskData);
  }

  /**
   * Actualiza una tarea existente (ej. alternar isCompleted o editar título).
   */
  updateTask(id: string, data: any): Promise<void> {
    const taskDocRef = doc(this.firestore, `tasks/${id}`);
    const dataToUpdate = { ...data };
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
