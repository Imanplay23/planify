import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor() {}
  ngOnInit() {
    const prefersDark = localStorage.getItem('darkMode');
    if (prefersDark === 'true') {
      document.documentElement.classList.add('ion-palette-dark');
    }
  }
}
