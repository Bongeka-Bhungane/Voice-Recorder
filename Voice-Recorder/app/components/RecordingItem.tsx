import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTheme } from "../context/ThemeContext";

type Props = {
  title?: string;
  date?: string;
  duration?: string;
  isPlaying?: boolean;
  speed?: number;
  progress?: number;
  onPlay?: () => void;
  onLongPress?: () => void;
  onSpeedChange?: () => void;
};

export default function RecordingItem({
  title,
  date,
  duration,
  isPlaying = false,
  speed = 1,
  progress = 0,
  onPlay,
  onLongPress,
  onSpeedChange,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onLongPress={onLongPress}
      style={[
        styles.wrapper,
        { backgroundColor: colors.card }, // ✅ FIX
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.date, { color: colors.subText }]}>{date}</Text>
        </View>

        <View style={styles.right}>
          <Text style={[styles.duration, { color: colors.subText }]}>
            {duration}
          </Text>

          <View style={styles.controls}>
            {/* SPEED */}
            <Pressable
              style={[styles.speedButton, { backgroundColor: colors.text }]}
              onPress={onSpeedChange}
            >
              <Text style={[styles.speedText, { color: colors.background }]}>
                {speed}x
              </Text>
            </Pressable>

            {/* PLAY / PAUSE */}
            <Pressable
              style={[styles.playButton, { backgroundColor: colors.text }]}
              onPress={onPlay}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={16}
                color={colors.background}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* 🔴 PROGRESS LINE */}
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.subText },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(progress * 100, 100)}%` },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },

  card: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  info: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "500",
  },

  date: {
    fontSize: 14,
    marginTop: 4,
  },

  right: {
    alignItems: "center",
  },

  duration: {
    fontSize: 12,
    marginBottom: 4,
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 24,
  },

  speedText: {
    fontSize: 12,
    fontWeight: "600",
  },

  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  /* 🔴 PROGRESS BAR */
  progressTrack: {
    height: 3,
    width: "100%",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#e53935", // 🔴 red for both themes
  },
});
