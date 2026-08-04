import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaOdontologos } from './lista-odontologos';

describe('ListaOdontologos', () => {
  let component: ListaOdontologos;
  let fixture: ComponentFixture<ListaOdontologos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaOdontologos],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaOdontologos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
