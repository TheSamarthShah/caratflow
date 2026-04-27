import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { DateTime } from "src/core/components/datetime/datetime";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DateTime, CommonModule,
    ReactiveFormsModule,],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  date: Date = new Date();
}
