import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';
import { AuthService } from '../core/services/auth.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
  ]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  mode: AuthMode = 'login';
  isLoading = false;
  errorMessage = '';

  form: FormGroup = this.fb.group({
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    addIcons({ calendarOutline });
  }

  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.errorMessage = '';
  }

  async submit() {
    if (this.form.invalid || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { displayName, email, password } = this.form.value;

    try {
      if (this.mode === 'register') {
        await this.authService.register(email.trim(), password, (displayName || '').trim());
      } else {
        await this.authService.login(email.trim(), password);
      }
      await this.router.navigateByUrl('/tabs/tab1');
    } catch (error: any) {
      this.errorMessage = this.mapError(error?.code);
    } finally {
      this.isLoading = false;
    }
  }

  private mapError(code?: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con ese correo.';
      case 'auth/invalid-email':
        return 'Ese correo no es válido.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Correo o contraseña incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
      default:
        return 'Ocurrió un error. Intenta de nuevo.';
    }
  }
}
