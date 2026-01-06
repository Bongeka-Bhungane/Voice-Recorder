import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

type Props = {
  title?: string;
  date?: string;
  duration?: string;
  isPlaying?: boolean;
  onPlay: () => void;
  onLongPress?: () => void;
};

export default function RecordingItem({
  title,
  date,
  duration,
  isPlaying,
  onPlay,
  onLongPress,
}: Props) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={300}>
      <View style={styles.card}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.duration}>{duration}</Text>
          <Pressable style={styles.playButton} onPress={onPlay}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={16} color="#000" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#373738ff",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  date: {
    color: "#9e9e9e",
    fontSize: 14,
    marginTop: 4,
  },
  right: {
    alignItems: "center",
  },
  duration: {
    color: "#9e9e9e",
    fontSize: 12,
    marginBottom: 4,
  },
  playButton: {
    backgroundColor: "#fff",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
