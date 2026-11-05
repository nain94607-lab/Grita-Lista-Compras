import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Audio } from "expo-av";
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Trophy,
  Flame,
  Code2,
} from "lucide-react-native";

const MIN_THRESHOLD = 20;
const MAX_THRESHOLD = 75;
const TOTAL_TILES = 9;

const STAGES = [
  {
    id: 1,
    title: "1. Paz en el Valle Jurásico",
    subtitle:
      "Habla frente al micrófono de forma constante para dar vida al paisaje.",
  },
  {
    id: 2,
    title: "2. Sombra en el Firmamento",
    subtitle: "Modula tu voz con precisión para poner a salvo a la manada.",
  },
  {
    id: 3,
    title: "3. La Extinción Inminente",
    subtitle: "Controla tu respiración para alcanzar el refugio de la cueva.",
  },
];

interface Particle {
  id: number;
  x: number;
  y: number;
  rot: number;
  scale: number;
  color: string;
}

export default function PantallaDinoPuzzle() {
  const [gameState, setGameState] = useState<
    "IDLE" | "PLAYING" | "VICTORY" | "SHATTERED"
  >("IDLE");
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [assembledCount, setAssembledCount] = useState(0);
  const [volume, setVolume] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStage = STAGES[currentStageIndex];

  // MICRÓFONO NATIVO REAL CON EXPO-AV
  const startRealMicrophone = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert(
          "¡El profesor exige el uso del micrófono! Debes aceptar los permisos.",
        );
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
        iosMeteringEnabled: true,
        androidMeteringEnabled: true,
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setMicActive(true);

      // Monitorear decibeles reales del micrófono del celular
      intervalRef.current = setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            const db = status.metering; // Rango típico entre -60 y 0 dB
            const mapped = Math.min(
              100,
              Math.max(0, Math.round(((db + 50) / 50) * 100)),
            );
            setVolume(mapped);
          }
        } catch {
          // Ignorar micro-retrasos de muestreo
        }
      }, 150);

      return true;
    } catch (e) {
      console.log(e);
      alert("No se pudo iniciar el micrófono nativo en este dispositivo.");
      setMicActive(false);
      return false;
    }
  };

  const stopRealMicrophone = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (e) {
      console.log(e);
    }
    setMicActive(false);
    setVolume(0);
  };

  // MOTOR DEL JUEGO
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const interval = setInterval(() => {
      if (volume > MAX_THRESHOLD) {
        triggerShatterEffect();
        setGameState("SHATTERED");
      } else if (volume >= MIN_THRESHOLD && volume <= MAX_THRESHOLD) {
        setAssembledCount((prev) => {
          if (prev < TOTAL_TILES) {
            const next = prev + 1;
            if (next === TOTAL_TILES) {
              setTimeout(() => {
                if (currentStageIndex < STAGES.length - 1) {
                  setCurrentStageIndex((s) => s + 1);
                  setAssembledCount(0);
                } else {
                  setGameState("VICTORY");
                }
              }, 400);
            }
            return next;
          }
          return prev;
        });
      } else {
        setAssembledCount((prev) => Math.max(0, prev - 1));
      }
    }, 600);

    return () => clearInterval(interval);
  }, [gameState, volume, currentStageIndex]);

  const triggerShatterEffect = () => {
    const newParticles: Particle[] = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      rot: Math.random() * 360,
      scale: Math.random() * 0.8 + 0.4,
      color: ["#ef4444", "#f97316", "#eab308", "#78716c"][
        Math.floor(Math.random() * 4)
      ],
    }));
    setParticles(newParticles);
  };

  const handleStart = async () => {
    const success = await startRealMicrophone();
    if (success) {
      setAssembledCount(0);
      setCurrentStageIndex(0);
      setGameState("PLAYING");
      setParticles([]);
    }
  };

  useEffect(() => {
    return () => {
      stopRealMicrophone();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Flame size={20} color="#020617" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Grita: Dino Puzzle</Text>
            <Text style={styles.headerSubtitle}>
              Control por Voz Nativo (Expo AV)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setSoundEnabled(!soundEnabled)}
          style={styles.soundButton}
        >
          {soundEnabled ? (
            <Volume2 size={18} color="#34d399" />
          ) : (
            <VolumeX size={18} color="#64748b" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.topInfoBox}>
          <View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Etapa {currentStageIndex + 1} de {STAGES.length}
              </Text>
            </View>
            <Text style={styles.stageTitle}>{currentStage.title}</Text>
          </View>
          <View style={styles.counterBox}>
            <Text style={styles.counterLabel}>Piezas</Text>
            <Text style={styles.counterValue}>
              {assembledCount}
              <Text style={styles.counterMax}>/{TOTAL_TILES}</Text>
            </Text>
          </View>
        </View>
        <Text style={styles.subtitleText}>{currentStage.subtitle}</Text>

        <View style={styles.puzzleContainer}>
          {gameState === "SHATTERED" && (
            <View style={styles.overlayAbsolute}>
              {particles.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.particle,
                    {
                      backgroundColor: p.color,
                      transform: [
                        { translateX: p.x },
                        { translateY: p.y },
                        { rotate: `${p.rot}deg` },
                        { scale: p.scale },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          )}

          <View style={styles.puzzleInner}>
            <View
              style={[
                styles.sceneryBackground,
                {
                  backgroundColor:
                    currentStageIndex === 0
                      ? "#0f172a"
                      : currentStageIndex === 1
                        ? "#451a03"
                        : "#581c87",
                },
              ]}
            >
              <View
                style={[
                  styles.meteorSun,
                  {
                    backgroundColor:
                      currentStageIndex === 0 ? "#fbbf24" : "#f97316",
                  },
                ]}
              />
              <View style={styles.groundLayer} />
            </View>

            <View style={styles.grid}>
              {[...Array(TOTAL_TILES)].map((_, i) => {
                const isAssembled = i < assembledCount;
                return (
                  <View
                    key={i}
                    style={[
                      styles.tile,
                      isAssembled ? styles.tileAssembled : styles.tilePending,
                    ]}
                  >
                    {!isAssembled && (
                      <Text style={styles.tileText}>{i + 1}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {gameState === "IDLE" && (
            <View style={styles.overlayModal}>
              <View style={styles.modalIcon}>
                <Mic size={28} color="#fbbf24" />
              </View>
              <Text style={styles.modalTitle}>Activa tu Voz</Text>
              <Text style={styles.modalDesc}>
                Habla al micrófono para mantener tu voz en la Zona Dulce
                (20%-75%). ¡Si gritas mucho, cae el meteorito!
              </Text>
              <TouchableOpacity
                onPress={handleStart}
                style={styles.primaryButton}
              >
                <Play size={16} color="#020617" />
                <Text style={styles.primaryButtonText}>
                  CONECTAR MICRÓFONO Y JUGAR
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "SHATTERED" && (
            <View
              style={[
                styles.overlayModal,
                { backgroundColor: "rgba(69, 10, 10, 0.95)" },
              ]}
            >
              <Flame size={32} color="#f87171" style={{ marginBottom: 6 }} />
              <Text style={styles.modalTitleRed}>¡IMPACTO DE METEORITO!</Text>
              <Text style={styles.modalDesc}>
                Gritaste demasiado fuerte y se rompió todo.
              </Text>
              <TouchableOpacity
                onPress={handleStart}
                style={styles.dangerButton}
              >
                <RotateCcw size={14} color="#ffffff" />
                <Text style={styles.dangerButtonText}>REINTENTAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "VICTORY" && (
            <View
              style={[
                styles.overlayModal,
                { backgroundColor: "rgba(6, 78, 59, 0.95)" },
              ]}
            >
              <Trophy size={32} color="#fbbf24" style={{ marginBottom: 6 }} />
              <Text style={styles.modalTitleGold}>¡ESPECIE A SALVO!</Text>
              <TouchableOpacity onPress={handleStart} style={styles.goldButton}>
                <RotateCcw size={14} color="#020617" />
                <Text style={styles.goldButtonText}>JUGAR DE NUEVO</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomControlBox}>
          <View style={styles.controlHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Code2 size={14} color="#fbbf24" />
              <Text style={styles.controlLabel}>
                Volumen de Voz:{" "}
                <Text style={{ color: "#ffffff" }}>{volume}%</Text>
              </Text>
            </View>
            <View
              style={[
                styles.micButton,
                micActive ? styles.micActive : styles.micInactive,
              ]}
            >
              <Mic size={12} color={micActive ? "#6ee7b7" : "#fca5a5"} />
              <Text
                style={[
                  styles.micButtonText,
                  { color: micActive ? "#6ee7b7" : "#fca5a5" },
                ]}
              >
                {micActive ? "Micrófono Activo" : "Micrófono Inactivo"}
              </Text>
            </View>
          </View>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${volume}%`,
                  backgroundColor:
                    volume > MAX_THRESHOLD
                      ? "#ef4444"
                      : volume >= MIN_THRESHOLD
                        ? "#10b981"
                        : "#475569",
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 12,
    paddingTop: 45,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    padding: 8,
    backgroundColor: "#f59e0b",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f8fafc",
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#94a3b8",
  },
  soundButton: {
    padding: 8,
    backgroundColor: "#1e293b",
    borderRadius: 10,
  },
  card: {
    flex: 1,
    width: "100%",
    backgroundColor: "#0f172a",
    borderWidth: 2,
    borderColor: "#1e293b",
    borderRadius: 24,
    padding: 14,
    marginVertical: 10,
    justifyContent: "space-between",
  },
  topInfoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 14,
    marginBottom: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(120, 53, 15, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fbbf24",
    textTransform: "uppercase",
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#f1f5f9",
  },
  counterBox: {
    alignItems: "flex-end",
  },
  counterLabel: {
    fontSize: 10,
    color: "#94a3b8",
  },
  counterValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#34d399",
  },
  counterMax: {
    fontSize: 11,
    color: "#475569",
  },
  subtitleText: {
    fontSize: 12,
    color: "#cbd5e1",
    marginBottom: 8,
  },
  puzzleContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(2, 6, 23, 0.9)",
    borderWidth: 2,
    borderColor: "#1e293b",
    borderRadius: 16,
    padding: 8,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginVertical: 6,
  },
  puzzleInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#090d16",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    position: "relative",
    overflow: "hidden",
  },
  sceneryBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  meteorSun: {
    position: "absolute",
    top: 20,
    right: 25,
    width: 35,
    height: 35,
    borderRadius: 18,
  },
  groundLayer: {
    width: "100%",
    height: 40,
    backgroundColor: "#14532d",
  },
  grid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 6,
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  tile: {
    width: "30%",
    height: "30%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tileAssembled: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  tilePending: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    borderStyle: "dashed",
  },
  tileText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
  },
  overlayAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  overlayModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(2, 6, 23, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 40,
    borderRadius: 14,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
  },
  modalTitleRed: {
    fontSize: 15,
    fontWeight: "900",
    color: "#f87171",
    marginBottom: 4,
  },
  modalTitleGold: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fbbf24",
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 11,
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 12,
    maxWidth: 220,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#020617",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dc2626",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dangerButtonText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  goldButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  goldButtonText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#020617",
  },
  bottomControlBox: {
    backgroundColor: "rgba(2, 6, 23, 0.9)",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 16,
    padding: 10,
    gap: 8,
  },
  controlHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94a3b8",
  },
  micButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  micActive: {
    backgroundColor: "rgba(6, 78, 59, 0.8)",
    borderColor: "rgba(52, 211, 153, 0.5)",
  },
  micInactive: {
    backgroundColor: "rgba(69, 10, 10, 0.8)",
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  micButtonText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  barTrack: {
    width: "100%",
    height: 12,
    backgroundColor: "#090d16",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  barFill: {
    height: "100%",
  },
});
