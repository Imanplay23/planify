import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { IonButtons, IonBackButton, IonItem, IonList, IonIcon, IonToggle, IonLabel } from "@ionic/angular";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonLabel, IonToggle, IonIcon, IonList, IonItem, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  isDarkMode = false;

  constructor() { }

  ngOnInit() {
    const prefersDark = localStorage.getItem('darkMode');
    if (prefersDark === 'true') {
      this.isDarkMode = true;
    }
  }

  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }
}
