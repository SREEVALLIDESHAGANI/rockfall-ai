import type { HealthResponse, ModelInfo, PredictInput, PredictResponse } from "../types/prediction";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((item: { msg?: string }) => item.msg).join("; ");
    } catch {
      /* keep default */
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return handle(await fetch(`${API_BASE}/health`));
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  return handle(await fetch(`${API_BASE}/model/info`));
}

export async function predictRisk(payload: PredictInput): Promise<PredictResponse> {
  return handle(
    await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}
