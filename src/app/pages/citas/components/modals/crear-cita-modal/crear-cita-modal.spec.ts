import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearCitaModal } from './crear-cita-modal';

describe('CrearCitaModal', () => {
  let component: CrearCitaModal;
  let fixture: ComponentFixture<CrearCitaModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearCitaModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearCitaModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
