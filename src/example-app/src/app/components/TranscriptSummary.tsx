"use client";

import { useState } from "react";
import { Button } from "./button";

interface TranscriptSummaryProps {
  recordingUrl: string | null;
}

interface TranscriptData {
  transcription: string;
  summary: string;
}

export default function TranscriptSummary({ recordingUrl }: TranscriptSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TranscriptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateTranscriptAndSummary = async () => {
    if (!recordingUrl) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordingUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe recording");
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Transcription error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      {!recordingUrl ? (
        <p className="text-muted-foreground">No recording available yet</p>
      ) : !data && !loading ? (
        <div className="flex justify-center">
          <Button onClick={generateTranscriptAndSummary} disabled={loading}>
            Generate Transcript and Summary
          </Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            Processing recording... This may take a few minutes.
          </p>
        </div>
      ) : error ? (
        <div className="text-destructive p-4 rounded-md border border-destructive">
          <p>Error: {error}</p>
          <Button variant="outline" onClick={generateTranscriptAndSummary} className="mt-2">
            Try Again
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="bg-secondary/50 p-3 rounded-md whitespace-pre-wrap">
              {data.summary}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Transcript</h3>
            <div className="bg-secondary/50 p-3 rounded-md max-h-60 overflow-y-auto whitespace-pre-wrap">
              {data.transcription}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 