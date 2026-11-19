import { useState, useCallback } from "react";

export function useGritoDinosaurio() {
  const [tiempoVivo, setTiempoVivo] = useState(0);
  const [intensidadSimulada, setIntensidadSimulada] = useState(0);

  const cambiarIntensidad = useCallback((nuevoValor: number) => {
    const valorAjustado = Math.max(0, Math.min(1, nuevoValor));
    setIntensidadSimulada(valorAjustado);

    if (valorAjustado >= 0.3 && valorAjustado <= 0.8) {
      setTiempoVivo((prev) => prev + 1);
    }
  }, []);

  return {
    tiempoVivo,
    intensidad: intensidadSimulada,
    cambiarIntensidad,
  };
}
