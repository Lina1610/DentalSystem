import { TestBed } from '@angular/core/testing';

import { Cita } from './cita.service';

describe('Cita', () => {
  let service: Cita;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cita);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
