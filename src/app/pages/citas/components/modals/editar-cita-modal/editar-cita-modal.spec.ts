import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarCitaModal } from './editar-cita-modal';

describe('EditarCitaModal', () => {
  let component: EditarCitaModal;
  let fixture: ComponentFixture<EditarCitaModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarCitaModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarCitaModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
