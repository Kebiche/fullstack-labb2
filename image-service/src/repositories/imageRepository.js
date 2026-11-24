import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const imageColumns = `
  SELECT id, patient_id AS patientId, original_name AS originalName,
         file_name AS fileName, width, height, version,
         created_by AS createdBy, updated_by AS updatedBy,
         created_at AS createdAt, updated_at AS updatedAt
  FROM images
`;

export class ImageRepository {
  constructor(databasePath) {
    mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        original_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        version INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        updated_by INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS images_patient_id ON images(patient_id);
    `);
  }

  findById(id) {
    return this.database.prepare(`${imageColumns} WHERE id = ?`).get(id);
  }

  findByPatient(patientId) {
    return this.database.prepare(`${imageColumns} WHERE patient_id = ? ORDER BY created_at DESC, id`).all(patientId);
  }

  insert(image) {
    this.database.prepare(`
      INSERT INTO images (id, patient_id, original_name, file_name, width, height,
                          version, created_by, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(image.id, image.patientId, image.originalName, image.fileName,
      image.width, image.height, image.createdBy, image.createdBy, image.createdAt, image.createdAt);
  }

  updateFile(id, currentVersion, fileName, userId, updatedAt) {
    // Bara en ändring åt gången får ersätta samma bildversion.
    const result = this.database.prepare(`
      UPDATE images SET file_name = ?, version = version + 1, updated_by = ?, updated_at = ?
      WHERE id = ? AND version = ?
    `).run(fileName, userId, updatedAt, id, currentVersion);
    return result.changes === 1;
  }

  close() {
    this.database.close();
  }
}
