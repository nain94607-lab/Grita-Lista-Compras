import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { useListaCompras } from "../../hooks/useListaCompras";
import { FilaProducto } from "../../components/FilaProducto";

const TEXTO_PLACEHOLDER = "Agregar producto (ej: Leche)";
const TEXTO_BOTON_AGREGAR = "Agregar";
const MENSAJE_VACIO = "Sin productos. ¡Agregá el primero! 😊";

export default function PantallaListaCompras() {
  const {
    items,
    textoInput,
    setTextoInput,
    agregarItem,
    alternarEstadoItem,
    eliminarItem,
  } = useListaCompras();

  return (
    <View style={styles.contenedorPrincipal}>
      <Text style={styles.titulo}>🛒 Lista de Compras</Text>

      <View style={styles.filaEntrada}>
        <TextInput
          value={textoInput}
          onChangeText={setTextoInput}
          placeholder={TEXTO_PLACEHOLDER}
          style={styles.entradaTexto}
          returnKeyType="done"
          onSubmitEditing={agregarItem}
        />
        <Pressable style={styles.botonAgregar} onPress={agregarItem}>
          <Text style={styles.textoBotonAgregar}>{TEXTO_BOTON_AGREGAR}</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FilaProducto
            item={item}
            onToggle={alternarEstadoItem}
            onRemove={eliminarItem}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.textoVacio}>{MENSAJE_VACIO}</Text>
        }
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  titulo: { fontSize: 24, fontWeight: "bold", marginTop: 12 },
  filaEntrada: { flexDirection: "row", gap: 8 },
  entradaTexto: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  botonAgregar: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonAgregar: { color: "#fff", fontWeight: "600" },
  separador: { height: 1, backgroundColor: "#eee" },
  textoVacio: { textAlign: "center", color: "#777", marginTop: 24 },
});
