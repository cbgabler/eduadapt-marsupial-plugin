import { jest } from "@jest/globals";

const mockCreateScenario = jest.fn();
const mockGetAllScenarios = jest.fn();

await jest.unstable_mockModule("../database/dataModels.js", () => ({
  createScenario: mockCreateScenario,
  getAllScenarios: mockGetAllScenarios,
}));

const { seedExampleScenarios } = await import(
  "../database/exampleScenarios.js"
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("seedExampleScenarios", () => {
  test("creates example scenarios when database is empty", async () => {
    mockGetAllScenarios.mockReturnValueOnce([]);
    mockCreateScenario.mockReturnValueOnce(1).mockReturnValueOnce(2);

    const result = await seedExampleScenarios();

    expect(mockCreateScenario).toHaveBeenCalledTimes(2);
    expect(mockCreateScenario).toHaveBeenNthCalledWith(
      1,
      "Post-Operative Hypertension Management",
      expect.objectContaining({
        patient: expect.objectContaining({ name: "John Martinez" }),
      })
    );
    expect(mockCreateScenario).toHaveBeenNthCalledWith(
      2,
      "Diabetic Patient with Hypoglycemia",
      expect.objectContaining({
        patient: expect.objectContaining({ name: "Maria Rodriguez" }),
      })
    );
    expect(result).toEqual([
      { id: 1, name: "Post-Operative Hypertension Management" },
      { id: 2, name: "Diabetic Patient with Hypoglycemia" },
    ]);
  });

  test("skips seeding when scenarios already exist", async () => {
    const existing = [{ id: 42, name: "Existing" }];
    mockGetAllScenarios.mockReturnValueOnce(existing);

    const result = await seedExampleScenarios();

    expect(result).toBe(existing);
    expect(mockCreateScenario).not.toHaveBeenCalled();
  });

  test("continues seeding if one scenario fails to insert", async () => {
    mockGetAllScenarios.mockReturnValueOnce([]);
    const error = new Error("db failure");
    mockCreateScenario
      .mockImplementationOnce(() => {
        throw error;
      })
      .mockReturnValueOnce(11);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await seedExampleScenarios();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error creating scenario"),
      error
    );
    expect(result).toEqual([
      { id: 11, name: "Diabetic Patient with Hypoglycemia" },
    ]);

    consoleSpy.mockRestore();
  });
});
