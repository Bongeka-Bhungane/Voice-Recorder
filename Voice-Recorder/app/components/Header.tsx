import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

type Props = {
  onFilterPress?: () => void;
};

const Header = ({ onFilterPress }: Props) => {
  const { toggleTheme, theme, colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.text }]}>Recorder</Text>

      <View style={{ flexDirection: "row", gap: 18 }}>
        <Pressable onPress={toggleTheme}>
          <Ionicons
            name={theme === "dark" ? "sunny-outline" : "moon-outline"}
            size={22}
            color={colors.icon}
          />
        </Pressable>

        <Pressable onPress={onFilterPress}>
          <Ionicons name="filter-outline" size={22} color={colors.icon} />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
  },
});
