import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FilmsService } from '../../services/films.service';
import { Film } from '../../entities/film';
import { Person } from '../../entities/person';
import { Postava } from '../../entities/postava';
import { MatSelectModule } from '@angular/material/select';


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
    MatIconModule,
    MatSelectModule  
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
      afi2007: [null],
      reziser: this.fb.array([]),
      postava: this.fb.array([])
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.filmId = +idParam;
      this.filmService.getById(this.filmId).subscribe(film => {
        this.filmModel.patchValue({
          nazov: film.nazov,
          slovenskyNazov: film.slovenskyNazov,
          rok: film.rok,
          imdbID: film.imdbID,
          afi1998: film.poradieVRebricku?.['AFI 1998'],
          afi2007: film.poradieVRebricku?.['AFI 2007'],
        });

        const reziserArray = this.reziser;
        film.reziser.forEach(person => {
          reziserArray.push(this.fb.group({
            krstneMeno: [person.krstneMeno],
            stredneMeno: [person.stredneMeno],
            priezvisko: [person.priezvisko]
          }));
        });

        const postavaArray = this.postava;
        film.postava.forEach(postava => {
          postavaArray.push(this.fb.group({
            postava: [postava.postava],
            dolezitost: [postava.dolezitost],
            herec: this.fb.group({
              krstneMeno: [postava.herec.krstneMeno],
              stredneMeno: [postava.herec.stredneMeno],
              priezvisko: [postava.herec.priezvisko]
            })
          }));
        });
      });
    }
  }

  save(): void {
    const formValue = this.filmModel.value;

    const reziserList: Person[] = formValue.reziser.map((r: any) =>
      new Person(r.id, r.krstneMeno, r.stredneMeno, r.priezvisko)
    );
    
    const postavaList: Postava[] = formValue.postava.map((p: any) =>
      new Postava(
        p.postava,
        p.dolezitost,
        new Person(p.herec.id, p.herec.krstneMeno, p.herec.stredneMeno, p.herec.priezvisko)
      )
    );
    

    const film: Film = new Film(
      formValue.nazov,
      formValue.rok,
      formValue.slovenskyNazov,
      formValue.imdbID || '',
      reziserList,
      postavaList,
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
    if (this.filmId) {
      this.filmService.delete(this.filmId).subscribe(() => {
        this.router.navigate(['/films']);
      });
    }
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

  get reziser(): FormArray {
    return this.filmModel.get('reziser') as FormArray;
  }

  get postava(): FormArray {
    return this.filmModel.get('postava') as FormArray;
  }

  addReziser(): void {
    this.reziser.push(this.fb.group({
      id: [null],
      krstneMeno: [''],
      stredneMeno: [''],
      priezvisko: ['']
    }));
  }
  

  removeReziser(index: number): void {
    this.reziser.removeAt(index);
  }

  addPostava(): void {
    this.postava.push(this.fb.group({
      postava: [''],
      dolezitost: ['hlavná postava'],
      herec: this.fb.group({
        id: [null],
        krstneMeno: [''],
        stredneMeno: [''],
        priezvisko: ['']
      })
    }));
  }

  removePostava(index: number): void {
    this.postava.removeAt(index);
  }

  printErrors(errors: any): string {
    return Object.keys(errors).map(k => `${k}: ${errors[k]}`).join(', ');
  }
}
