import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "./context/ThemeContext";

export default function RecordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const recordingRef = useRef<Audio.Recording | null>(null);
  const animationRef = useRef<number | null>(null);

  const startTimestampRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const totalPausedRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  const RECORDINGS_DIR = FileSystem.documentDirectory + "recordings/";

  // 🎙️ START RECORDING (SAFE)
  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      router.back();
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recordingRef.current = recording;

    startTimestampRef.current = Date.now();
    totalPausedRef.current = 0;
    pauseStartRef.current = null;

    setDurationMs(0);
    setIsPaused(false);
    setIsRecording(true);
  };

  // ⏱️ TIMER LOOP
  const tick = () => {
    if (!isRecording || isPaused) return;

    const now = Date.now();
    const elapsed = now - startTimestampRef.current - totalPausedRef.current;

    setDurationMs(elapsed);
    animationRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isRecording && !isPaused) {
      animationRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // ⏸️ PAUSE / ▶️ RESUME
  const togglePause = async () => {
    if (!recordingRef.current) return;

    if (isPaused) {
      // Resume
      await recordingRef.current.startAsync();

      if (pauseStartRef.current) {
        totalPausedRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }

      setIsPaused(false);
    } else {
      // Pause
      pauseStartRef.current = Date.now();
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
    }
  };

  // ⏹️ STOP & SAVE
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();

    recordingRef.current = null;
    setIsRecording(false);

    if (!uri) {
      router.back();
      return;
    }

    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, {
      intermediates: true,
    });

    const newUri = RECORDINGS_DIR + `${Date.now()}.m4a`;
    await FileSystem.moveAsync({ from: uri, to: newUri });

    router.back();
  };

  // 🕒 FORMAT TIME
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}:${hundredths.toString().padStart(2, "0")}`;
  };

  // Auto start on mount
  useEffect(() => {
    startRecording();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerText, { color: colors.text }]}>Record</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* TIMER */}
      <Text style={[styles.timer, { color: colors.text }]}>
        {formatTime(durationMs)}
      </Text>

      <Text style={[styles.subText, { color: colors.subText }]}>
        Recording in progress
      </Text>

      {/* CONTROLS */}
      <View style={styles.controls}>
        <View style={{ width: 40 }} />

        <Pressable style={styles.stopButton} onPress={stopRecording}>
          <Ionicons name="stop" size={28} color="#fff" />
        </Pressable>

        <Pressable onPress={togglePause}>
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={26}
            color={colors.accent}
          />
          <Text style={[styles.controlText, { color: colors.subText }]}>
            {isPaused ? "Resume" : "Pause"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerText: { fontSize: 20, fontWeight: "600" },
  timer: { fontSize: 48, textAlign: "center", marginTop: 80 },
  subText: { textAlign: "center", marginTop: 10 },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  stopButton: {
    backgroundColor: "#e53935",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
});
