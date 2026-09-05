import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonNote,
  IonListHeader
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonNote,
    IonListHeader
  ],
})
export class Tab3Page implements OnInit {
  darkMode = false;

  ngOnInit() {
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    this.applyDarkMode(this.darkMode);
  }

  toggleDarkMode(enabled: boolean) {
    this.darkMode = enabled;
    this.applyDarkMode(enabled);
    localStorage.setItem('darkMode', String(enabled));
  }

  private applyDarkMode(enabled: boolean) {
    document.body.classList.toggle('dark', enabled);
  }
}

