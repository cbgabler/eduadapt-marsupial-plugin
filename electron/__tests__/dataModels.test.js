import { jest } from "@jest/globals";

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
  createScenario,
  getScenarioById,
  getAllScenarios,
  updateScenario,
  deleteScenario,
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
