import { getDb } from "../database.js";

export function addSessionNote({
  sessionId,
  userId,
  content,
  vitalsSnapshot = null,
}) {
  const db = getDb();
  const sanitizedContent = (content ?? "").trim();
  if (!sanitizedContent) {
    throw new Error("Note content is required");
  }

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO notes (sessionId, userId, content, vitalsSnapshot, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    sessionId,
    userId,
    sanitizedContent,
    vitalsSnapshot ? JSON.stringify(vitalsSnapshot) : null,
    createdAt
  );

  return {
    id: info.lastInsertRowid,
    sessionId,
    userId,
    content: sanitizedContent,
    createdAt,
    vitalsSnapshot,
  };
}

export function getSessionNotes(sessionId) {
  const db = getDb();
  const rows = db
    .prepare(
      `
    SELECT id, sessionId, userId, content, vitalsSnapshot, createdAt
    FROM notes
    WHERE sessionId = ?
    ORDER BY datetime(createdAt) ASC, id ASC
  `
    )
    .all(sessionId);

  return rows.map((row) => ({
    ...row,
    vitalsSnapshot: row.vitalsSnapshot
      ? JSON.parse(row.vitalsSnapshot)
      : null,
  }));
}

export function deleteSessionNote({ noteId, userId }) {
  const db = getDb();
  const note = db
    .prepare("SELECT * FROM notes WHERE id = ?")
    .get(noteId);
  if (!note) {
    throw new Error("Note not found");
  }
  if (userId && note.userId !== userId) {
    throw new Error("You do not have permission to delete this note");
  }
  db.prepare("DELETE FROM notes WHERE id = ?").run(noteId);
  return {
    ...note,
    vitalsSnapshot: note.vitalsSnapshot
      ? JSON.parse(note.vitalsSnapshot)
      : null,
  };
}