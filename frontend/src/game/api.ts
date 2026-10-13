import axios from "axios";
import type { GameContent, ActResponse } from "./types";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export async function fetchContent(): Promise<GameContent> {
  const res = await axios.get<GameContent>(`${API}/content`);
  return res.data;
}

export async function encounterAct(params: {
  encounter_id: string;
  step: number;
  text: string;
  inventory: string[];
  flags: string[];
}): Promise<ActResponse> {
  const res = await axios.post<ActResponse>(`${API}/encounter/act`, params);
  return res.data;
}

export function telemetry(event: string, scene?: string, data: Record<string, unknown> = {}) {
  axios.post(`${API}/telemetry`, { event, scene, data }).catch(() => {});
}
