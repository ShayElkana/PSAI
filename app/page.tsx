"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Orb } from "@/components/orb/Orb";
import { ChatPanel, type ChatMessage } from "@/components/chat/ChatPanel";
import { VoiceControls } from "@/components/chat/VoiceControls";
import { LanguageSelector } from "@/components/chat/LanguageSelector";
import { PcmPlayer } from "@/lib/audio/playback";
import { downsampleFloat32, floatTo16BitPCM, uint8ArrayToBase64, rms } from "@/lib/audio/pcm";
import {
  getLanguageSnapshot,
  getServerLanguageSnapshot,
  setStoredLanguage,
  subscribeToLanguage,
} from "@/lib/languageStore";
import type { ClientToRelay, Emotion, Language, RelayState, RelayToClient } from "@/types/conversation";

const INPUT_SAMPLE_RATE = 16000;

function emotionForState(state: RelayState): Emotion {
  if (state === "speaking") return "warm";
  if (state === "listening") return "listening";
  if (state === "reconnecting" || state === "error") return "concerned";
  return "calm";
}

export default function Home() {
  const [relayState, setRelayState] = useState<RelayState>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);
  const [textInput, setTextInput] = useState("");
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  // Server and the first client render both see "en" (avoids a hydration
  // mismatch); the real stored value takes over right after mount.
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    playerRef.current = new PcmPlayer(ctx, (level) => setAudioLevel(level));

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Read directly rather than via the `language` hook value — this effect
    // only runs once at mount, client-side, so a direct synchronous read is
    // simpler and doesn't depend on useSyncExternalStore's hydration-repair
    // render having already landed by the time this runs.
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/relay?lang=${getLanguageSnapshot()}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg: RelayToClient = JSON.parse(event.data);
      switch (msg.type) {
        case "state":
          setRelayState(msg.state);
          break;
        case "audio_chunk":
          playerRef.current?.enqueue(msg.data);
          break;
        case "transcript": {
          setMessages((prev) => {
            const id = `${msg.role}-partial`;
            const existing = prev.find((m) => m.id === id);
            const nextText = (existing?.text ?? "") + msg.text;
            const withoutPartial = prev.filter((m) => m.id !== id);
            return [...withoutPartial, { id, role: msg.role, text: nextText }];
          });
          break;
        }
        case "transcript_final": {
          // Authoritative full text for the turn, replacing the partial
          // (streamed-delta) bubble so it stops receiving further deltas.
          setMessages((prev) => {
            const partialId = `${msg.role}-partial`;
            const withoutPartial = prev.filter((m) => m.id !== partialId);
            return [
              ...withoutPartial,
              {
                id: `${msg.role}-final-${Date.now()}`,
                role: msg.role,
                text: msg.text,
                translatedText: msg.translatedText,
              },
            ];
          });
          break;
        }
        case "safety_notice":
          setSafetyNotice(msg.text);
          break;
        case "error":
          console.error("[psai] relay error", msg.message);
          break;
      }
    };

    ws.onclose = () => setRelayState("reconnecting");

    return () => {
      ws.close();
      ctx.close();
    };
  }, []);

  const sendToRelay = useCallback((msg: ClientToRelay) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const stopMic = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    sendToRelay({ type: "audio_end" });
    setMicEnabled(false);
  }, [sendToRelay]);

  const startMic = useCallback(async () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      await ctx.audioWorklet.addModule("/worklets/pcm-capture-worklet.js");
      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, "pcm-capture-processor");
      workletNodeRef.current = worklet;

      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const downsampled = downsampleFloat32(event.data, ctx.sampleRate, INPUT_SAMPLE_RATE);
        const pcm16 = floatTo16BitPCM(downsampled);
        const bytes = new Uint8Array(pcm16.buffer);
        sendToRelay({ type: "audio_chunk", data: uint8ArrayToBase64(bytes) });
        setAudioLevel(rms(downsampled));
      };

      source.connect(worklet);
      setMicEnabled(true);
    } catch (err) {
      console.error("[psai] mic unavailable", err);
      setMicAvailable(false);
    }
  }, [sendToRelay]);

  const handleToggleMic = useCallback(() => {
    if (micEnabled) {
      stopMic();
    } else {
      void startMic();
    }
  }, [micEnabled, startMic, stopMic]);

  const handleLanguageChange = useCallback(
    (next: Language) => {
      setStoredLanguage(next);
      sendToRelay({ type: "set_language", language: next });
    },
    [sendToRelay]
  );

  const handleSendText = useCallback(() => {
    if (!textInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `user-text-${Date.now()}`, role: "user", text: textInput },
    ]);
    sendToRelay({ type: "text", text: textInput });
    setTextInput("");
  }, [sendToRelay, textInput]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        minHeight: "100vh",
        padding: "2rem 1rem",
      }}
    >
      <LanguageSelector language={language} onChange={handleLanguageChange} />

      <Orb state={relayState} emotion={emotionForState(relayState)} audioLevel={audioLevel} />

      {safetyNotice && (
        <p
          role="status"
          style={{ maxWidth: 420, textAlign: "center", fontSize: "0.85rem", color: "#5b8def" }}
        >
          {safetyNotice}
        </p>
      )}

      <ChatPanel messages={messages} />

      <VoiceControls
        state={relayState}
        micEnabled={micEnabled}
        micAvailable={micAvailable}
        onToggleMic={handleToggleMic}
        textInput={textInput}
        onTextInputChange={setTextInput}
        onSendText={handleSendText}
      />
    </main>
  );
}
