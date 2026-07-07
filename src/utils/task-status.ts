/** True when a task status string marks the task completed, regardless of UI language. */
export function isTaskCompleted(status: string): boolean {
  return status.includes('✅');
}
