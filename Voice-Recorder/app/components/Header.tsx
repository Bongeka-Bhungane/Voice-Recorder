import { StyleSheet, Text, View, Pressable } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  onFilterPress?: () => void;
}

const Header = ({ onFilterPress }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Recoder</Text>

      <View >
        <Pressable onPress={onFilterPress}>
          <Ionicons name="filter-outline" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 60,
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
});