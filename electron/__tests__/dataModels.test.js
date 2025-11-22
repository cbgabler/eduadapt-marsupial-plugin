import { jest } from "@jest/globals";
import { scryptSync } from "crypto";

const mockPrepare = jest.fn();
const mockDb = { prepare: mockPrepare };
const mockGetDb = jest.fn(() => mockDb);

const runResults = [];
const getResults = [];
const allResults = [];
let preparedStatements = [];

await jest.unstable_mockModule("../database/database.js", () => ({
  getDb: mockGetDb,
}));

const {
  registerUser,
  authenticateUser,
  createScenario,
  getScenarioById,
  getAllScenarios,
  updateScenario,
  deleteScenario,
  addSessionNote,
  getSessionNotes,
  deleteSessionNote,
} = await import("../database/dataModels.js");

beforeEach(() => {
  jest.clearAllMocks();
  runResults.length = 0;
  getResults.length = 0;
  allResults.length = 0;
  preparedStatements = [];

  mockPrepare.mockImplementation((sql) => {
    const statement = {
      sql,
      run: jest.fn(() =>
        runResults.length > 0 ? runResults.shift() : undefined
      ),
      get: jest.fn(() =>
        getResults.length > 0 ? getResults.shift() : undefined
      ),
      all: jest.fn(() =>
        allResults.length > 0 ? allResults.shift() : undefined
      ),
    };
    preparedStatements.push(statement);
    return statement;
  });
});

describe("auth helpers", () => {
  test("registerUser inserts sanitized user record", () => {
    getResults.push(undefined);
    getResults.push({
      id: 5,
      username: "nurse",
      role: "instructor",
      passwordHash: "salt:hash",
    });
    runResults.push({ lastInsertRowid: 5 });

    const user = registerUser({
      username: "  nurse ",
      password: "Secure123",
      role: "instructor",
    });

    expect(user).toEqual({ id: 5, username: "nurse", role: "instructor" });
    expect(preparedStatements[0].sql).toContain("SELECT id FROM users");
    expect(preparedStatements[0].get).toHaveBeenCalledWith("nurse");
    const insertStmt = preparedStatements[1];
    expect(insertStmt.sql).toContain("INSERT INTO users");
    expect(insertStmt.run).toHaveBeenCalledWith(
      "nurse",
      "instructor",
      expect.stringMatching(/^[0-9a-f]+:[0-9a-f]+$/)
    );
    expect(preparedStatements[2].sql).toContain("SELECT * FROM users");
    expect(preparedStatements[2].get).toHaveBeenCalledWith(5);
  });

  test("registerUser throws if username already exists", () => {
    getResults.push({ id: 1 });
    expect(() =>
      registerUser({ username: "duplicate", password: "Secure123" })
    ).toThrow("Username already exists");
  });

  test("authenticateUser returns sanitized user on match", () => {
    const salt = "0123456789abcdef0123456789abcdef";
    const hash = scryptSync("Secure123", salt, 64).toString("hex");
    getResults.push({
      id: 9,
      username: "nurse",
      role: "student",
      passwordHash: `${salt}:${hash}`,
    });

    const user = authenticateUser(" nurse ", "Secure123");

    expect(user).toEqual({ id: 9, username: "nurse", role: "student" });
    expect(preparedStatements[0].sql).toContain("SELECT * FROM users");
    expect(preparedStatements[0].get).toHaveBeenCalledWith("nurse");
  });

  test("authenticateUser throws when password mismatches", () => {
    const salt = "fedcba9876543210fedcba9876543210";
    const hash = scryptSync("Secure123", salt, 64).toString("hex");
    getResults.push({
      id: 2,
      username: "educator",
      role: "instructor",
      passwordHash: `${salt}:${hash}`,
    });

    expect(() => authenticateUser("educator", "Wrong123")).toThrow(
      "Invalid username or password"
    );
  });
});

describe("scenario data model helpers", () => {
  test("createScenario persists definitions as JSON and returns the ID", () => {
    runResults.push({ lastInsertRowid: 99 });

    const definition = { patient: { name: "Test Patient" } };
    const rowId = createScenario("Example", definition);

    expect(rowId).toBe(99);
    const statement = preparedStatements[0];
    expect(statement.sql).toContain("INSERT INTO scenarios");
    expect(statement.run).toHaveBeenCalledWith(
      "Example",
      JSON.stringify(definition)
    );
  });

  test("getScenarioById parses definition JSON", () => {
    getResults.push({
      id: 7,
      name: "Example",
      definition: JSON.stringify({ key: "value" }),
    });

    const scenario = getScenarioById(7);

    expect(scenario.definition).toEqual({ key: "value" });
    const statement = preparedStatements[0];
    expect(statement.sql).toContain("WHERE id = ?");
    expect(statement.get).toHaveBeenCalledWith(7);
  });

  test("getAllScenarios parses JSON definitions for each row", () => {
    allResults.push([
      {
        id: 1,
        name: "One",
        definition: JSON.stringify({ testing: "good" }),
      },
      { id: 2, name: "Two", definition: null },
    ]);

    const scenarios = getAllScenarios();

    expect(scenarios).toEqual([
      { id: 1, name: "One", definition: { testing: "good" }},
      { id: 2, name: "Two", definition: null },
    ]);
    const statement = preparedStatements[0];
    expect(statement.sql).toContain("SELECT * FROM scenarios");
    expect(statement.all).toHaveBeenCalledTimes(1);
  });

  test("updateScenario returns true when a row is changed", () => {
    runResults.push({ changes: 1 });

    const updated = updateScenario(3, "Updated", { testing: "changed" });

    expect(updated).toBe(true);
    const statement = preparedStatements[0];
    expect(statement.sql).toContain("UPDATE scenarios");
    expect(statement.run).toHaveBeenCalledWith(
      "Updated",
      JSON.stringify({ testing: "changed" }),
      3
    );
  });

  test("updateScenario returns false when no rows change", () => {
    runResults.push({ changes: 0 });

    expect(updateScenario(4, "Name", { testing: "good" })).toBe(false);
  });

  test("deleteScenario returns true when a row is removed", () => {
    runResults.push({ changes: 1 });

    expect(deleteScenario(8)).toBe(true);
    const statement = preparedStatements[0];
    expect(statement.sql).toContain("DELETE FROM scenarios");
    expect(statement.run).toHaveBeenCalledWith(8);
  });

  test("deleteScenario returns false when nothing is removed", () => {
    runResults.push({ changes: 0 });

    expect(deleteScenario(10)).toBe(false);
  });
});

describe("session notes helpers", () => {
  test("addSessionNote stores sanitized content and returns payload", () => {
    const mockNow = "2024-01-01T00:00:00.000Z";
    runResults.push({ lastInsertRowid: 42 });
    const dateSpy = jest.spyOn(global, "Date").mockImplementation(
      () =>
        ({
          toISOString: () => mockNow,
        })
    );

    const note = addSessionNote({
      sessionId: 9,
      userId: 3,
      content: "  important update ",
      vitalsSnapshot: { heartRate: 88 },
    });

    const statement = preparedStatements[0];
    expect(statement.sql).toContain("INSERT INTO notes");
    expect(statement.run).toHaveBeenCalledWith(
      9,
      3,
      "important update",
      JSON.stringify({ heartRate: 88 }),
      mockNow
    );
    expect(note).toEqual({
      id: 42,
      sessionId: 9,
      userId: 3,
      content: "important update",
      createdAt: mockNow,
      vitalsSnapshot: { heartRate: 88 },
    });

    dateSpy.mockRestore();
  });

  test("getSessionNotes parses vitals snapshot JSON", () => {
    allResults.push([
      {
        id: 1,
        sessionId: 9,
        userId: 3,
        content: "note one",
        vitalsSnapshot: JSON.stringify({ heartRate: 90 }),
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        sessionId: 9,
        userId: 4,
        content: "note two",
        vitalsSnapshot: null,
        createdAt: "2024-01-01T00:05:00Z",
      },
    ]);

    const notes = getSessionNotes(9);

    const statement = preparedStatements[0];
    expect(statement.sql).toContain("FROM notes");
    expect(statement.all).toHaveBeenCalledWith(9);
    expect(notes).toEqual([
      {
        id: 1,
        sessionId: 9,
        userId: 3,
        content: "note one",
        createdAt: "2024-01-01T00:00:00Z",
        vitalsSnapshot: { heartRate: 90 },
      },
      {
        id: 2,
        sessionId: 9,
        userId: 4,
        content: "note two",
        createdAt: "2024-01-01T00:05:00Z",
        vitalsSnapshot: null,
      },
    ]);
  });

  test("deleteSessionNote removes note and enforces ownership", () => {
    const noteRow = {
      id: 5,
      sessionId: 9,
      userId: 3,
      content: "note",
      vitalsSnapshot: JSON.stringify({ heartRate: 80 }),
      createdAt: "2024-01-01T00:00:00Z",
    };
    getResults.push(noteRow);
    runResults.push({ changes: 1 });

    const deleted = deleteSessionNote({ noteId: 5, userId: 3 });

    expect(deleted).toEqual({
      ...noteRow,
      vitalsSnapshot: { heartRate: 80 },
    });
    expect(preparedStatements[0].sql).toContain("SELECT * FROM notes");
    expect(preparedStatements[1].sql).toContain("DELETE FROM notes");

    // Now test forbidden deletion
    getResults.push(noteRow);
    expect(() =>
      deleteSessionNote({ noteId: 5, userId: 10 })
    ).toThrow("You do not have permission");
  });
});
