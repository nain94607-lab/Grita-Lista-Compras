import React from "react";
import { StyleSheet, Text, Pressable } from "react-native";
import { Item } from "../types";

type PropiedadesFilaProducto = {
  item: Item;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export const FilaProducto = ({
  item,
  onToggle,
  onRemove,
}: PropiedadesFilaProducto) => (
  <Pressable
    onPress={() => onToggle(item.id)}
    onLongPress={() => onRemove(item.id)}
    style={styles.fila}
  >
    <Text style={[styles.textoFila, item.done && styles.textoCompletado]}>
      {item.name}
    </Text>
    <Text
      style={[
        styles.marcador,
        item.done ? styles.marcadorCompletado : styles.marcadorPendiente,
      ]}
    >
      {item.done ? "✔" : "•"}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  textoFila: { fontSize: 16 },
  textoCompletado: { textDecorationLine: "line-through", color: "#999" },
  marcador: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "700",
  },
  marcadorPendiente: { backgroundColor: "#eee", color: "#666" },
  marcadorCompletado: { backgroundColor: "#2ecc71", color: "#fff" },
});
