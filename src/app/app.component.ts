import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UploaderComponent } from './components/uploader/uploader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UploaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'transloadit';
}
