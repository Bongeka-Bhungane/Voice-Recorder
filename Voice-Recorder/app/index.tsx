import { View, StyleSheet, FlatList, TextInput, Pressable } from "react-native";
import Header from "./components/Header";
import RecordingItem from "./components/RecordingItem";
import { Ionicons } from "@expo/vector-icons";

const recordings = [
  {
    id: "1",
    title: "Meeting with Bob",
    date: "2023-10-01",
    duration: "00:30:15",
  },
  {
    id: "2",
    title: "Grocery List",
    date: "2023-10-02",
    duration: "00:05:20",
  },
  {
    id: "3",
    title: "Project Ideas",
    date: "2023-10-03",
    duration: "00:12:45",
  },
];

export default function Index() {
  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#9e9e9e" />
        <TextInput
          placeholder="Search recordings"
          placeholderTextColor={"#9e9e9e"}
          style={styles.input}
        />
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16, padding: 6, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <RecordingItem
            title={item.title}
            date={item.date}
            duration={item.duration}
          />
        )}
      />

      <Pressable style={styles.recordButton}>
        <Ionicons name="mic" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  searchBox: {
    margin: 20,
    backgroundColor: "#373738ff",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    marginLeft: 10,
    color: "#fff",
    flex: 1,
  },
  recordButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#e53935",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
