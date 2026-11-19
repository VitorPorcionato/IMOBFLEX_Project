"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
export function useResource(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setData(await api(path));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [path]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, reload, setError };
}
