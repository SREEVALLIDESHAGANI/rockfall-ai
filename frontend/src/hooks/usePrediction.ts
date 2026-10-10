import { useCallback, useState } from "react";

import { predictRisk } from "../services/api";
import type { PredictInput, PredictResponse } from "../types/prediction";

export function usePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  const run = useCallback(async (payload: PredictInput) => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictRisk(payload);
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Prediction failed";
      setError(message);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, result, run, setResult };
}
