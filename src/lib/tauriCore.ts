type InvokeArgs = Record<string, unknown>;

export async function invoke<T = unknown>(
  command: string,
  args: InvokeArgs = {},
): Promise<T> {
  const response = await fetch("/api/commands", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ command, args }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Command failed: ${command}`);
  }

  return payload.data as T;
}
