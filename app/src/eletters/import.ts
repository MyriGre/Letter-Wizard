// AI-AGENT-HEADER
// path: /src/eletters/import.ts
// summary: Client helper to parse an uploaded questionnaire file into builder-friendly draft JSON.
// last-reviewed: 2026-01-12

import type { Letter } from '../types/editor';

type ImportResponse = {
  draftJson?: Letter;
  notes?: string[];
  warning?: string;
  error?: string;
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] ?? '' : result;
      if (!base64) {
        reject(new Error('Failed to extract file data'));
        return;
      }
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export async function importQuestionnaireFile(file: File): Promise<ImportResponse> {
  const base64 = await readFileAsBase64(file);
  const resp = await fetch('/api/eletters/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      data: base64,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    let message = text || `HTTP ${resp.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      // keep text
    }
    return { error: message };
  }
  const data = (await resp.json()) as ImportResponse;
  return data;
}
