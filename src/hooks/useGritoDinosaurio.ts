import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";

export function useGritoDinosaurio() {
  const [tiempoVivo, setTiempoVivo] = useState(0);
  const [intensidad, setIntensidad] = useState(0);
  const [microListo, setMicroListo] = useState(false);
  const [errorMicro, setErrorMicro] = useState<string | null>(null);

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });

  const intensidadRef = useRef(0);

  useEffect(() => {
    let montado = true;
    let intervaloLectura: ReturnType<typeof setInterval> | null = null;
    let intervaloTiempo: ReturnType<typeof setInterval> | null = null;
    let rafWeb: number | null = null;
    let streamWeb: MediaStream | null = null;
    let audioCtxWeb: AudioContext | null = null;

    const actualizarSuavizado = (nuevoBruto: number) => {
      const clamped = Math.max(0, Math.min(1, nuevoBruto));
      // Suavizado para evitar saltos bruscos
      const suavizado = intensidadRef.current * 0.65 + clamped * 0.35;
      const finalValor = suavizado < 0.04 ? 0 : Number(suavizado.toFixed(3));
      intensidadRef.current = finalValor;
      setIntensidad(finalValor);
    };

    const iniciarMicrofono = async () => {
      try {
        if (
          Platform.OS === "web" &&
          typeof navigator !== "undefined" &&
          navigator.mediaDevices?.getUserMedia
        ) {
          streamWeb = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          if (!montado) return;

          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioCtxWeb = new AudioCtx();
          const source = audioCtxWeb.createMediaStreamSource(streamWeb);
          const analyser = audioCtxWeb.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const data = new Uint8Array(analyser.frequencyBinCount);
          setMicroListo(true);

          const loopWeb = () => {
            if (!montado) return;
            analyser.getByteFrequencyData(data);
            let suma = 0;
            for (let i = 0; i < data.length; i++) {
              suma += data[i];
            }
            const promedio = suma / data.length / 255;
            // Filtra ruido leve en web y escala voz/grito
            const ruidoFiltrado = Math.max(0, promedio - 0.14) / 0.86;
            actualizarSuavizado(ruidoFiltrado * 1.6);
            rafWeb = requestAnimationFrame(loopWeb);
          };
          loopWeb();
        } else {
          const permiso = await AudioModule.requestRecordingPermissionsAsync();
          if (!permiso.granted) {
            if (montado) {
              setErrorMicro("Permiso de micrófono denegado");
            }
            return;
          }

          await AudioModule.setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
          });

          await recorder.prepareToRecordAsync();
          recorder.record();

          if (!montado) return;
          setMicroListo(true);

          intervaloLectura = setInterval(() => {
            if (!montado) return;
            const status = recorder.getStatus();
            // Si metering no viene o está muy bajo, asumimos silencio
            const db =
              typeof status.metering === "number" ? status.metering : -50;
            // Piso en -28 dB (ruido ambiente normal) hasta -2 dB (grito fuerte)
            const pisoDb = -28;
            const techoDb = -2;
            const normalizado = (db - pisoDb) / (techoDb - pisoDb);
            actualizarSuavizado(normalizado);
          }, 100);
        }

        intervaloTiempo = setInterval(() => {
          if (!montado) return;
          if (intensidadRef.current >= 0.05 && intensidadRef.current <= 0.9) {
            setTiempoVivo((prev) => prev + 1);
          }
        }, 1000);
      } catch {
        if (montado) {
          setErrorMicro("No se pudo iniciar el micrófono");
        }
      }
    };

    iniciarMicrofono();

    return () => {
      montado = false;
      if (intervaloLectura) clearInterval(intervaloLectura);
      if (intervaloTiempo) clearInterval(intervaloTiempo);
      if (rafWeb !== null) cancelAnimationFrame(rafWeb);
      if (streamWeb) {
        streamWeb.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxWeb) {
        audioCtxWeb.close().catch(() => {});
      }
      try {
        recorder.stop();
      } catch {
        // Ignorar si ya estaba detenido
      }
    };
  }, [recorder]);

  return {
    tiempoVivo,
    intensidad,
    microListo,
    errorMicro,
  };
}
