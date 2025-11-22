import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getDb } from "../database.js";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

const VALID_ROLES = new Set(["student", "instructor", "admin"]);

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    username: user.username,
    role: user.role ?? "student",
  };
};

const sanitizePasswordInput = (password) => {
  const normalized = typeof password === "string" ? password.trim() : "";
  if (!normalized) {
    throw new Error("Password is required");
  }
  return normalized;
};

const validateNewPassword = (password) => {
  const normalized = sanitizePasswordInput(password);
  if (normalized.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }
  return normalized;
};

const generatePasswordHash = (password) => {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }
  try {
    const [salt, originalHash] = storedHash.split(":");
    const derivedHash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
    return timingSafeEqual(
      Buffer.from(originalHash, "hex"),
      Buffer.from(derivedHash, "hex")
    );
  } catch {
    return false;
  }
};

const normalizeRole = (role) =>
  VALID_ROLES.has(role) ? role : "student";

export function registerUser({ username, password, role = "student" } = {}) {
  const db = getDb();
  const normalizedUsername = (username ?? "").trim();
  if (!normalizedUsername) {
    throw new Error("Username is required");
  }

  const normalizedPassword = validateNewPassword(password);
  const passwordHash = generatePasswordHash(normalizedPassword);

  const existingUser = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(normalizedUsername);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const stmt = db.prepare(`
    INSERT INTO users (
      username,
      role,
      passwordHash
    ) VALUES (
      ?, ?, ?
    );
  `);

  const info = stmt.run(
    normalizedUsername,
    normalizeRole(role),
    passwordHash
  );
  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(info.lastInsertRowid);
  return sanitizeUser(user);
}

export function authenticateUser(username, password) {
  const db = getDb();
  const normalizedUsername = (username ?? "").trim();
  if (!normalizedUsername) {
    throw new Error("Username is required");
  }
  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(normalizedUsername);
  if (!user || !user.passwordHash) {
    throw new Error("Invalid username or password");
  }
  const normalizedPassword = sanitizePasswordInput(password);
  if (!verifyPassword(normalizedPassword, user.passwordHash)) {
    throw new Error("Invalid username or password");
  }
  return sanitizeUser(user);
}

// Gets
export function getUserById(userId) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
}

export function getUserByUsername(username) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function getUserByEmail(email) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function getAllUsers() {
  const db = getDb();
  return db.prepare("SELECT * FROM users").all();
}