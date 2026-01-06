import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";

export default function RecordScreen() {
  const router = useRouter();
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationMs, setDurationMs] = useState(0); // displayed timer
  const startTimeRef = useRef<number>(0); // timestamp when recording started or resumed
  const pausedTimeRef = useRef<number>(0); // total paused duration

  const RECORDINGS_DIR = FileSystem.documentDirectory + "recordings/";
  const animationFrameRef = useRef<number | null>(null);

  // ⏱ SMOOTH TIMER
  const updateTimer = () => {
    if (isRecording && !isPaused) {
      const now = Date.now();
      setDurationMs(now - startTimeRef.current - pausedTimeRef.current);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  };

  useEffect(() => {
    if (isRecording && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, isPaused]);

  // 🎙 START RECORDING
  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recordingRef.current = recording;
    setIsRecording(true);
    setIsPaused(false);
    setDurationMs(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = Date.now();
  };

  // ⏸ PAUSE / RESUME
  const togglePause = async () => {
    if (!recordingRef.current) return;

    if (isPaused) {
      await recordingRef.current.startAsync();
      setIsPaused(false);
      // Adjust paused duration
      pausedTimeRef.current += Date.now() - pausedTimeRef.current;
      startTimeRef.current = Date.now() - durationMs; // maintain elapsed time
    } else {
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
    }
  };

  // ⏹ STOP RECORDING
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();

    if (!uri) return;

    const newUri = RECORDINGS_DIR + `${Date.now()}.m4a`;
    await FileSystem.moveAsync({ from: uri, to: newUri });

    router.back(); // go back, main screen reloads via useFocusEffect
  };


  // FORMAT TIME MM:SS:HS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}:${hundredths.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    startRecording();
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerText}>Record</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* TIMER */}
      <Text style={styles.timer}>{formatTime(durationMs)}</Text>
      <Text style={styles.subText}>You can record for several more hours</Text>

      {/* CONTROLS */}
      <View style={styles.controls}>
        <Pressable>
          <Ionicons name="pricetag-outline" size={26} color="#aaa" />
          <Text style={styles.controlText}>Tag</Text>
        </Pressable>

        <Pressable style={styles.stopButton} onPress={stopRecording}>
          <Ionicons name="stop" size={28} color="#fff" />
        </Pressable>

        <Pressable onPress={togglePause}>
          <Ionicons name={isPaused ? "play" : "pause"} size={26} color="#fff" />
          <Text style={styles.controlText}>
            {isPaused ? "Resume" : "Pause"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerText: { color: "#fff", fontSize: 20, fontWeight: "600" },
  timer: { color: "#fff", fontSize: 48, textAlign: "center", marginTop: 80 },
  subText: { color: "#9e9e9e", textAlign: "center", marginTop: 10 },
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
    color: "#9e9e9e",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
});
