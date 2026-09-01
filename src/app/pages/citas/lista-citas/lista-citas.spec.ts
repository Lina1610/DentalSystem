import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCitas } from './lista-citas';

describe('ListaCitas', () => {
  let component: ListaCitas;
  let fixture: ComponentFixture<ListaCitas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCitas],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaCitas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
