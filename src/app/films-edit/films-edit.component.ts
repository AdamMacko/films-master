import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Angular Material moduly
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatError } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { FilmsService } from '../../services/films.service';
import { Film } from '../../entities/film';

@Component({
  selector: 'app-films-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './films-edit.component.html',
  styleUrls: ['./films-edit.component.css']
})
export class FilmsEditComponent implements OnInit {
  filmModel!: FormGroup;
  filmId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private filmService: FilmsService
  ) {}

  ngOnInit(): void {
    this.filmModel = this.fb.group({
      nazov: ['', Validators.required],
      slovenskyNazov: ['', Validators.required],
      rok: [null, [Validators.required, Validators.min(1900)]],
      imdbID: [''],
      afi1998: [null],
      afi2007: [null]
    });
    

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.filmId = +idParam;
      this.filmService.getById(this.filmId).subscribe(film => {
        this.filmModel.patchValue({
          ...film,
          afi1998: film.poradieVRebricku?.['AFI 1998'],
          afi2007: film.poradieVRebricku?.['AFI 2007']
        });
      });
    }
  }

  save(): void {
    const formValue = this.filmModel.value;
  
    const film: Film = new Film(
      formValue.nazov,
      formValue.rok,
      formValue.slovenskyNazov,
      formValue.imdbID || '',
      [], // režiséri
      [], // postavy
      {
        'AFI 1998': formValue.afi1998,
        'AFI 2007': formValue.afi2007
      },
      this.filmId ?? undefined
    );
  
    this.filmService.add(film).subscribe(() => {
      this.router.navigate(['/films']);
    });
  }
  
  delete(): void {
    this.filmService.delete(this.filmId!).subscribe(() => {
      this.router.navigate(['/films']);
    });
    
  }

  cancel(): void {
    this.router.navigate(['/films']);
  }
  
  
  

  titleS(): string {
    return this.filmId ? `Upraviť film #${this.filmId}` : 'Nový film';
  }

  get nazov() {
    return this.filmModel.get('nazov')!;
  }
  get slovenskyNazov() {
    return this.filmModel.get('slovenskyNazov')!;
  }
  get rok() {
    return this.filmModel.get('rok')!;
  }

  printErrors(errors: any): string {
    return Object.keys(errors).map(k => `${k}: ${errors[k]}`).join(', ');
  }
}
