import { describe, expect, it } from "vitest";
import { TestDriver } from "testdriverai/vitest/hooks";

describe("TaskFlow Application", () => {
  it("should display tasks, allow adding a new task, and filtering tasks", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: "https://testdriver-evaluation.vercel.app" });

    const headerAssert = await testdriver.assert("TaskFlow header and My Tasks title are visible");
    expect(headerAssert).toBeTruthy();

    await testdriver.find("Task title input field").click();
    await testdriver.type("Write automated tests with TestDriver");
    await testdriver.find("+ Add Task button").click();

    const taskAddedAssert = await testdriver.assert("Task 'Write automated tests with TestDriver' is in the task list");
    expect(taskAddedAssert).toBeTruthy();

    await testdriver.find("completed filter button").click();

    const completedAssert = await testdriver.assert("Only completed tasks are visible in the task list");
    expect(completedAssert).toBeTruthy();

    await testdriver.find("all filter button").click();

    const allAssert = await testdriver.assert("All tasks are visible in the task list");
    expect(allAssert).toBeTruthy();
  });
});
