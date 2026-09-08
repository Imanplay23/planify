import { Injectable, inject } from '@angular/core';
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
  where
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Activity } from '../models/activity.model';
import { Task } from '../models/task.model';
import { TaskList } from '../models/task-list.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private get activitiesCollection() {
    return collection(this.firestore, 'activities');
  }

  private get tasksCollection() {
    return collection(this.firestore, 'tasks');
  }

  private get taskListsCollection() {
    return collection(this.firestore, 'taskLists');
  }

  /**
   * uid del usuario autenticado, requerido para escribir cualquier documento
   * (así queda marcado de quién es y las reglas de Firestore pueden exigirlo).
   */
  private requireUid(): string {
    const uid = this.authService.currentUserId;
    if (!uid) {
      throw new Error('No hay un usuario autenticado.');
    }
    return uid;
  }

  // ==================== ACTIVITIES CRUD ====================

  /**
   * Obtiene en tiempo real las actividades del usuario autenticado (y solo las
   * suyas), ordenadas por fecha y hora. Si no hay sesión, emite un array vacío.
   */
  getActivities(): Observable<Activity[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of([]);
        const activitiesQuery = query(this.activitiesCollection, where('userId', '==', user.uid));
        return collectionData(activitiesQuery, { idField: 'id' }) as Observable<Activity[]>;
      }),
      map((activities) =>
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
   * (El acceso real lo controlan las reglas de seguridad de Firestore).
   */
  getActivityById(id: string): Observable<Activity | undefined> {
    const activityDocRef = doc(this.firestore, `activities/${id}`);
    return docData(activityDocRef, { idField: 'id' }) as Observable<Activity | undefined>;
  }

  /**
   * Agrega una nueva actividad a Firestore, marcada con el uid del usuario actual.
   */
  addActivity(activity: Omit<Activity, 'id'>): Promise<DocumentReference> {
    return addDoc(this.activitiesCollection, { ...activity, userId: this.requireUid() });
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
   * Obtiene en tiempo real las tareas del usuario autenticado, ordenadas por
   * fecha de creación (más recientes primero). Si no hay sesión, emite [].
   */
  getTasks(): Observable<Task[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of([]);
        const tasksQuery = query(this.tasksCollection, where('userId', '==', user.uid));
        return collectionData(tasksQuery, { idField: 'id' }) as Observable<Task[]>;
      }),
      map((tasks) =>
        [...tasks].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
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
   * Agrega una nueva tarea a Firestore con fecha de creación automática si no
   * se provee, marcada con el uid del usuario actual.
   */
  addTask(task: Omit<Task, 'id'> | Task): Promise<DocumentReference> {
    const taskData: Omit<Task, 'id'> = {
      title: task.title,
      isCompleted: Boolean(task.isCompleted),
      createdAt: task.createdAt || new Date().toISOString(),
      userId: this.requireUid()
    } as Omit<Task, 'id'>;
    if (task.dueDate) taskData.dueDate = task.dueDate;
    if (task.dueTime) taskData.dueTime = task.dueTime;
    if (task.listId) taskData.listId = task.listId;
    if (task.priority) taskData.priority = task.priority;
    if (task.hasAlert) taskData.hasAlert = task.hasAlert;
    if (task.notificationId) taskData.notificationId = task.notificationId;

    return addDoc(this.tasksCollection, taskData);
  }

  /**
   * Actualiza una tarea existente (ej. alternar isCompleted o editar título).
   */
  updateTask(id: string, data: Partial<Task>): Promise<void> {
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

  // ==================== TASK LISTS (categorías) CRUD ====================

  /**
   * Obtiene las listas/categorías del usuario autenticado, ordenadas por
   * fecha de creación.
   */
  getTaskLists(): Observable<TaskList[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return of([]);
        const listsQuery = query(this.taskListsCollection, where('userId', '==', user.uid));
        return collectionData(listsQuery, { idField: 'id' }) as Observable<TaskList[]>;
      }),
      map((lists) => [...lists].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')))
    );
  }

  /**
   * Crea una nueva lista/categoría de tareas, marcada con el uid del usuario actual.
   */
  addTaskList(list: Omit<TaskList, 'id'>): Promise<DocumentReference> {
    return addDoc(this.taskListsCollection, { ...list, userId: this.requireUid() });
  }

  /**
   * Elimina una lista/categoría. Las tareas que la tenían asignada conservan
   * su listId (quedan "huérfanas" y se agrupan como tareas sin lista al filtrar).
   */
  deleteTaskList(id: string): Promise<void> {
    const listDocRef = doc(this.firestore, `taskLists/${id}`);
    return deleteDoc(listDocRef);
  }
}
