import { useState } from "react";
import { Item } from "@/types";

export function useListaCompras() {
  const [items, setItems] = useState<Item[]>([]);
  const [textoInput, setTextoInput] = useState("");

  const agregarItem = () => {
    const textoLimpio = textoInput.trim();
    if (!textoLimpio) return;

    setItems((itemsAnteriores) => [
      ...itemsAnteriores,
      { id: String(Date.now()), name: textoLimpio, done: false },
    ]);
    setTextoInput("");
  };

  const alternarEstadoItem = (id: string) => {
    setItems((itemsAnteriores) =>
      itemsAnteriores.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  };

  const eliminarItem = (id: string) => {
    setItems((itemsAnteriores) =>
      itemsAnteriores.filter((item) => item.id !== id),
    );
  };

  return {
    items,
    textoInput,
    setTextoInput,
    agregarItem,
    alternarEstadoItem,
    eliminarItem,
  };
}
