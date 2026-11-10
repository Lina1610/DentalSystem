-- =========================================================
-- MIGRACIÓN 001: integridad entre cita y agenda
--
-- Regla: un horario de agenda lo ocupa como máximo UNA cita no cancelada,
-- esa cita es del mismo odontólogo que el horario, y el horario está
-- OCUPADO si y solo si tiene esa cita.
--
-- Ejecutar una sola vez sobre la base existente.
-- =========================================================

-- El archivo está en UTF-8: sin esto, el cliente mysql de Windows guarda
-- las tildes dañadas (p. ej. "migraci├│n").
SET NAMES utf8mb4;

START TRANSACTION;

-- ---------------------------------------------------------
-- 1. Reparar datos inconsistentes
-- ---------------------------------------------------------

-- Cita 9 (PENDIENTE) reservó el horario #2, que ya usó la cita #2 (FINALIZADA)
-- en la misma franja: se crea un horario nuevo del odontólogo 2 el mismo día,
-- 12:00–14:00, y se reprograma ahí.
INSERT INTO agenda (id_odontologo, fecha, hora_inicio, hora_fin, estado, observacion)
SELECT 2, '2026-05-20', '12:00:00', '14:00:00', 'DISPONIBLE',
       'Creado por migración 001 para reprogramar la cita #9'
FROM DUAL
WHERE EXISTS (
        SELECT 1 FROM cita
        WHERE id_cita = 9 AND id_agenda = 2 AND estado <> 'CANCELADA'
      )
  AND NOT EXISTS (
        SELECT 1 FROM agenda
        WHERE id_odontologo = 2 AND fecha = '2026-05-20'
          AND hora_inicio < '14:00:00' AND hora_fin > '12:00:00'
      );

SET @agenda_cita9 = (
  SELECT id_agenda FROM agenda
  WHERE id_odontologo = 2 AND fecha = '2026-05-20' AND hora_inicio = '12:00:00'
  LIMIT 1
);

UPDATE cita
SET id_agenda = @agenda_cita9,
    fecha_inicio = '2026-05-20 12:00:00',
    fecha_fin = '2026-05-20 14:00:00',
    observaciones = CONCAT_WS(' | ', NULLIF(observaciones, ''),
      'Reprogramada por migración 001: el horario #2 ya estaba usado por la cita #2.')
WHERE id_cita = 9 AND id_agenda = 2 AND estado <> 'CANCELADA'
  AND @agenda_cita9 IS NOT NULL;

-- Cita 6 (odontólogo 2) apuntaba al horario #1, que es del odontólogo 1.
-- Se reasigna al horario #2, del odontólogo 2. Está CANCELADA, así que no reserva nada.
UPDATE cita
SET id_agenda = 2
WHERE id_cita = 6 AND id_odontologo = 2;

-- Sincronizar el estado de cada horario con sus citas:
-- OCUPADO si tiene una cita no cancelada; si no, un OCUPADO huérfano vuelve a DISPONIBLE.
-- (BLOQUEADO / NO_DISPONIBLE sin citas se respetan.)
UPDATE agenda a
SET a.estado = CASE
    WHEN EXISTS (
      SELECT 1 FROM cita c
      WHERE c.id_agenda = a.id_agenda AND c.estado <> 'CANCELADA'
    ) THEN 'OCUPADO'
    WHEN a.estado = 'OCUPADO' THEN 'DISPONIBLE'
    ELSE a.estado
  END;

COMMIT;

-- ---------------------------------------------------------
-- 2. Restricciones para que no vuelva a ocurrir
--    (DDL: MySQL las confirma automáticamente)
-- ---------------------------------------------------------

-- La cita y su horario deben ser del mismo odontólogo.
-- RESTRICT: no se puede cambiar el odontólogo de un horario que tiene citas.
ALTER TABLE agenda
  ADD CONSTRAINT uq_agenda_id_odontologo UNIQUE (id_agenda, id_odontologo);

ALTER TABLE cita
  ADD CONSTRAINT fk_cita_agenda_odontologo
    FOREIGN KEY (id_agenda, id_odontologo)
    REFERENCES agenda (id_agenda, id_odontologo)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT;

-- Un horario solo puede tener una cita no cancelada.
-- La columna vale id_agenda mientras la cita esté activa y NULL si está cancelada;
-- el índice único admite varios NULL. INVISIBLE: no aparece en SELECT *.
ALTER TABLE cita
  ADD COLUMN agenda_reservada INT
    GENERATED ALWAYS AS (IF(estado <> 'CANCELADA', id_agenda, NULL)) VIRTUAL INVISIBLE,
  ADD CONSTRAINT uq_cita_agenda_reservada UNIQUE (agenda_reservada);
