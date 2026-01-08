import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";


type Props = {
  title?: string;
  date?: string;
  duration?: string;
  isPlaying?: boolean;
  speed?: number;
  onPlay?: () => void;
  onLongPress?: () => void;
  onSpeedChange?: () => void;
};

export default function RecordingItem({
  title,
  date,
  duration,
  isPlaying,
  speed = 1,
  onPlay,
  onLongPress,
  onSpeedChange,
}: Props) {

    const { colors } = useTheme();

  return (
    <Pressable
      onLongPress={onLongPress}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.date, { color: colors.subText }]}>{date}</Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.date, { color: colors.subText }]}>{duration}</Text>

        <View style={styles.controls}>
          {/* Speed */}
          <Pressable style={styles.speedButton} onPress={onSpeedChange}>
            <Text style={styles.speedText}>{speed}x</Text>
          </Pressable>

          {/* Play / Pause */}
          <Pressable style={styles.playButton} onPress={onPlay}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={16}
              color="#000"
            />
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
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  speedButton: {
    backgroundColor: "#2e2e2e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  speedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
