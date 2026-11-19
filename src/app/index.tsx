import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
} from "react-native";
import { useGritoDinosaurio } from "../hooks/useGritoDinosaurio";

export default function PantallaApocalipsisCretacico() {
  const { tiempoVivo, intensidad, cambiarIntensidad } = useGritoDinosaurio();

  const anchoBarraRef = useRef(290);
  const [faseTiempo, setFaseTiempo] = useState(0);

  const posArbolesX = useRef(new Animated.Value(0)).current;
  const caidaMeteoritoGigante = useRef(new Animated.Value(0)).current;

  // Faceta 1: Entra y pone el huevo
  const posDinoEntrada = useRef(new Animated.Value(-130)).current;
  const mostrarHuevo = useRef(new Animated.Value(0)).current;

  // Faceta 2: Se rompe el huevo y nace la cría
  const romperHuevo = useRef(new Animated.Value(1)).current;
  const saltoCria = useRef(new Animated.Value(0)).current;

  // Faceta 3: Crece y come
  const escalaCrecimiento = useRef(new Animated.Value(0.85)).current;
  const movimientoComer = useRef(new Animated.Value(0)).current;

  // Faceta 4: Manada recorriendo el suelo de izquierda a derecha hasta salir
  const marchaManada = useRef(new Animated.Value(-160)).current;
  const pasoManadaY = useRef(new Animated.Value(0)).current;

  // Faceta 5: Pelea contra T-Rex / Giganotosaurus
  const embestidaDino = useRef(new Animated.Value(0)).current;
  const embestidaRex = useRef(new Animated.Value(0)).current;

  const actualizarDesdeX = useCallback(
    (x: number) => {
      const ancho = anchoBarraRef.current || 290;
      const xClamped = Math.max(0, Math.min(ancho, x));
      cambiarIntensidad(xClamped / ancho);
    },
    [cambiarIntensidad],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          actualizarDesdeX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          actualizarDesdeX(evt.nativeEvent.locationX);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [actualizarDesdeX],
  );

  const esSilencio = intensidad < 0.05;
  const perdistePorVolumen = intensidad > 0.9;

  // 0 = Sin volumen
  // 1 = Pone el huevo
  // 2 = Se rompe el huevo y nace
  // 3 = Crece
  // 4 = Se junta con la manada
  // 5 = Pelea contra T-Rex / Giganotosaurus
  // 6 = Cae el meteorito, destruye todo y perdiste por exceso de volumen
  let facetaActual = 0;
  if (esSilencio) {
    facetaActual = 0;
  } else if (perdistePorVolumen) {
    facetaActual = 6;
  } else if (intensidad < 0.22) {
    facetaActual = 1;
  } else if (intensidad < 0.4) {
    facetaActual = 2;
  } else if (intensidad < 0.58) {
    facetaActual = 3;
  } else if (intensidad < 0.76) {
    facetaActual = 4;
  } else {
    facetaActual = 5;
  }

  // Variación de especie según el tramo de intensidad para que no sea siempre igual
  const varianteEspecie = useMemo(() => {
    if (intensidad < 0.35) return 0;
    if (intensidad < 0.55) return 1;
    if (intensidad < 0.75) return 2;
    return 3;
  }, [intensidad]);

  // A mayor volumen, menor duración (más rápido)
  const factorVelocidad = Math.max(0.22, 1 - intensidad * 0.78);

  // Ciclo del día
  useEffect(() => {
    if (perdistePorVolumen || esSilencio) return;
    const reloj = setInterval(() => {
      setFaseTiempo((prev) => (prev + 1) % 3);
    }, 4500 * factorVelocidad);
    return () => clearInterval(reloj);
  }, [perdistePorVolumen, esSilencio, factorVelocidad]);

  // Parallax del suelo/árboles
  useEffect(() => {
    if (perdistePorVolumen || esSilencio) return;
    posArbolesX.setValue(0);
    const loopArboles = Animated.loop(
      Animated.timing(posArbolesX, {
        toValue: -160,
        duration: 3600 * factorVelocidad,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loopArboles.start();
    return () => loopArboles.stop();
  }, [posArbolesX, perdistePorVolumen, esSilencio, factorVelocidad]);

  // Animación por faceta
  useEffect(() => {
    if (esSilencio || perdistePorVolumen) return;

    let animActiva: Animated.CompositeAnimation | null = null;

    if (facetaActual === 1) {
      posDinoEntrada.setValue(-130);
      mostrarHuevo.setValue(0);

      animActiva = Animated.sequence([
        Animated.timing(posDinoEntrada, {
          toValue: -10,
          duration: 850 * factorVelocidad,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(mostrarHuevo, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(posDinoEntrada, {
          toValue: 170,
          duration: 850 * factorVelocidad,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
      animActiva.start();
    } else if (facetaActual === 2) {
      romperHuevo.setValue(1.25);
      saltoCria.setValue(0);

      animActiva = Animated.sequence([
        Animated.timing(romperHuevo, {
          toValue: 0,
          duration: 320 * factorVelocidad,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(saltoCria, {
              toValue: -14,
              duration: 300 * factorVelocidad,
              useNativeDriver: true,
            }),
            Animated.timing(saltoCria, {
              toValue: 0,
              duration: 300 * factorVelocidad,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);
      animActiva.start();
    } else if (facetaActual === 3) {
      escalaCrecimiento.setValue(0.85);
      movimientoComer.setValue(0);

      animActiva = Animated.parallel([
        Animated.timing(escalaCrecimiento, {
          toValue: 1.15,
          duration: 900 * factorVelocidad,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(movimientoComer, {
              toValue: 6,
              duration: 380 * factorVelocidad,
              useNativeDriver: true,
            }),
            Animated.timing(movimientoComer, {
              toValue: 0,
              duration: 380 * factorVelocidad,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);
      animActiva.start();
    } else if (facetaActual === 4) {
      // Recorrido completo de izquierda a derecha hasta salir de la pantalla, pegados al suelo
      marchaManada.setValue(-170);
      pasoManadaY.setValue(0);

      const recorridoHorizontal = Animated.loop(
        Animated.sequence([
          Animated.timing(marchaManada, {
            toValue: 330,
            duration: 2400 * factorVelocidad,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(marchaManada, {
            toValue: -170,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

      const rebotePaso = Animated.loop(
        Animated.sequence([
          Animated.timing(pasoManadaY, {
            toValue: -3,
            duration: 180 * factorVelocidad,
            useNativeDriver: true,
          }),
          Animated.timing(pasoManadaY, {
            toValue: 0,
            duration: 180 * factorVelocidad,
            useNativeDriver: true,
          }),
        ]),
      );

      animActiva = Animated.parallel([recorridoHorizontal, rebotePaso]);
      animActiva.start();
    } else if (facetaActual === 5) {
      embestidaDino.setValue(0);
      embestidaRex.setValue(0);

      animActiva = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(embestidaDino, {
              toValue: 26,
              duration: 240 * factorVelocidad,
              useNativeDriver: true,
            }),
            Animated.timing(embestidaRex, {
              toValue: -26,
              duration: 240 * factorVelocidad,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(embestidaDino, {
              toValue: -6,
              duration: 240 * factorVelocidad,
              useNativeDriver: true,
            }),
            Animated.timing(embestidaRex, {
              toValue: 6,
              duration: 240 * factorVelocidad,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      animActiva.start();
    }

    return () => {
      animActiva?.stop();
    };
  }, [
    facetaActual,
    factorVelocidad,
    esSilencio,
    perdistePorVolumen,
    posDinoEntrada,
    mostrarHuevo,
    romperHuevo,
    saltoCria,
    escalaCrecimiento,
    movimientoComer,
    marchaManada,
    pasoManadaY,
    embestidaDino,
    embestidaRex,
  ]);

  // Faceta 6: Meteorito y extinción
  useEffect(() => {
    if (perdistePorVolumen) {
      caidaMeteoritoGigante.setValue(0);
      Animated.timing(caidaMeteoritoGigante, {
        toValue: 1,
        duration: 450,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [perdistePorVolumen, caidaMeteoritoGigante]);

  const meteoritoGiganteX = caidaMeteoritoGigante.interpolate({
    inputRange: [0, 1],
    outputRange: [310, 130],
  });
  const meteoritoGiganteY = caidaMeteoritoGigante.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 190],
  });

  const renderizarDinoVariado = (variante: number) => {
    if (variante === 1) {
      // Estegosaurio
      return (
        <View style={styles.dinoCaja}>
          <View style={styles.estegoCola} />
          <View style={styles.estegoCuerpo} />
          <View style={styles.estegoCuello} />
          <View style={styles.estegoCabeza} />
          <View style={styles.estegoPlaca1} />
          <View style={styles.estegoPlaca2} />
          <View style={styles.estegoPata1} />
          <View style={styles.estegoPata2} />
        </View>
      );
    }
    if (variante === 2) {
      // Braquiosaurio
      return (
        <View style={styles.dinoCaja}>
          <View style={styles.braquioCola} />
          <View style={styles.braquioCuerpo} />
          <View style={styles.braquioCuello} />
          <View style={styles.braquioCabeza} />
          <View style={styles.braquioPata1} />
          <View style={styles.braquioPata2} />
        </View>
      );
    }
    if (variante === 3) {
      // Terópodo / Cresta
      return (
        <View style={styles.dinoCaja}>
          <View style={styles.teroCola} />
          <View style={styles.teroCuerpo} />
          <View style={styles.teroCuello} />
          <View style={styles.teroCresta} />
          <View style={styles.teroCabeza} />
          <View style={styles.teroPataTrasera} />
          <View style={styles.teroPataDelantera} />
        </View>
      );
    }
    // Triceratops por defecto
    return (
      <View style={styles.dinoCaja}>
        <View style={styles.triceratopsCola} />
        <View style={styles.triceratopsCuerpo} />
        <View style={styles.triceratopsEscudo} />
        <View style={styles.triceratopsCabeza} />
        <View style={styles.triceratopsPata1} />
        <View style={styles.triceratopsPata2} />
      </View>
    );
  };

  const renderizarFaceta = () => {
    if (perdistePorVolumen) {
      return (
        <View style={styles.dinoCenizas}>
          <View style={styles.cenizaCuerpo} />
          <View style={styles.cenizaCabeza} />
          <View style={styles.particulaCeniza1} />
          <View style={styles.particulaCeniza2} />
        </View>
      );
    }

    if (facetaActual === 1) {
      return (
        <View style={styles.escenaNidoContainer}>
          <Animated.View
            style={[
              styles.actorEntrada,
              { transform: [{ translateX: posDinoEntrada }] },
            ]}
          >
            {renderizarDinoVariado(varianteEspecie)}
          </Animated.View>

          <Animated.View
            style={[styles.huevoContainer, { opacity: mostrarHuevo }]}
          >
            <View style={styles.huevoForma} />
          </Animated.View>
        </View>
      );
    }

    if (facetaActual === 2) {
      return (
        <View style={styles.escenaNidoContainer}>
          <Animated.View
            style={[
              styles.huevoContainer,
              {
                left: 35,
                opacity: romperHuevo,
                transform: [{ scale: romperHuevo }],
              },
            ]}
          >
            <View style={styles.huevoRoto} />
          </Animated.View>

          <Animated.View
            style={[
              styles.dinoCaja,
              { left: 65, transform: [{ translateY: saltoCria }] },
            ]}
          >
            <View style={styles.criaCola} />
            <View style={styles.criaCuerpo} />
            <View style={styles.criaCabeza} />
            <View style={styles.criaPata1} />
            <View style={styles.criaPata2} />
          </Animated.View>
        </View>
      );
    }

    if (facetaActual === 3) {
      return (
        <Animated.View
          style={[
            styles.dinoCaja,
            {
              left: 95,
              transform: [
                { scale: escalaCrecimiento },
                { translateY: movimientoComer },
              ],
            },
          ]}
        >
          {renderizarDinoVariado(varianteEspecie)}
        </Animated.View>
      );
    }

    if (facetaActual === 4) {
      // Manada variada (3 dinos distintos) caminando sobre el suelo hasta salir por la derecha
      return (
        <Animated.View
          style={[
            styles.manadaCaja,
            {
              transform: [
                { translateX: marchaManada },
                { translateY: pasoManadaY },
              ],
            },
          ]}
        >
          <View style={styles.miembroManada}>{renderizarDinoVariado(0)}</View>
          <View style={[styles.miembroManada, { transform: [{ scale: 0.9 }] }]}>
            {renderizarDinoVariado(1)}
          </View>
          <View
            style={[styles.miembroManada, { transform: [{ scale: 0.85 }] }]}
          >
            {renderizarDinoVariado(3)}
          </View>
        </Animated.View>
      );
    }

    if (facetaActual === 5) {
      return (
        <View style={styles.escenaPelea}>
          <Animated.View
            style={[
              styles.dinoCaja,
              {
                position: "absolute",
                left: 45,
                bottom: 0,
                transform: [{ translateX: embestidaDino }],
              },
            ]}
          >
            {renderizarDinoVariado(varianteEspecie)}
          </Animated.View>

          <Animated.View
            style={[
              styles.dinoCaja,
              {
                position: "absolute",
                left: 165,
                bottom: 0,
                transform: [{ scaleX: -1 }, { translateX: embestidaRex }],
              },
            ]}
          >
            <View style={styles.rexCola} />
            <View style={styles.rexCuerpo} />
            <View style={styles.rexCabeza} />
            <View style={styles.rexPata1} />
            <View style={styles.rexPata2} />
          </Animated.View>
        </View>
      );
    }

    return null;
  };

  const manejarLayoutBarra = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) anchoBarraRef.current = w;
  };

  const infoFacetas: Record<number, { titulo: string; desc: string }> = {
    0: {
      titulo: "SILENCIO",
      desc: "Sube el volumen para iniciar la vida del dinosaurio.",
    },
    1: {
      titulo: "1. PONE EL HUEVO",
      desc: "El dinosaurio entra en escena y deja su huevo en el nido.",
    },
    2: {
      titulo: "2. NACE LA CRÍA",
      desc: "Se rompe el cascarón y nace la cría.",
    },
    3: {
      titulo: "3. CRECE",
      desc: "El dinosaurio crece y se alimenta en el valle.",
    },
    4: {
      titulo: "4. MANADA",
      desc: "Varias especies caminan juntas por el suelo hasta cruzar el valle.",
    },
    5: {
      titulo: "5. PELEA VS T-REX / GIGANOTOSAURUS",
      desc: "Choque brutal por el territorio contra un depredador gigante.",
    },
    6: {
      titulo: "6. PERDISTE POR EXCESO DE VOLUMEN",
      desc: "Cayó el meteorito, destruyó el ecosistema y se acabó la partida.",
    },
  };

  const actualInfo = infoFacetas[facetaActual];

  return (
    <View style={styles.contenedor}>
      <Text style={styles.tituloArcade}>LITERATURA DIGITAL: GRITA</Text>
      <Text style={styles.subtituloArcade}>
        {esSilencio
          ? "[ SIN VOLUMEN ]"
          : perdistePorVolumen
            ? "☠️ [ PERDISTE POR EXCESO DE VOLUMEN ]"
            : faseTiempo === 0
              ? "[ AMANECER ]"
              : faseTiempo === 1
                ? "[ ATARDECER ]"
                : "[ NOCHE ]"}
      </Text>

      <View style={styles.marcadorPanel}>
        <Text style={styles.textoMarcador}>FACETA: {facetaActual} / 6</Text>
        <Text style={styles.textoMarcador}>
          VOLUMEN: {Math.round(intensidad * 100)}%
        </Text>
        <Text style={styles.textoMarcador}>TIEMPO: {tiempoVivo}s</Text>
      </View>

      <View
        style={[
          styles.pantallaArcade,
          {
            backgroundColor: esSilencio
              ? "#000000"
              : perdistePorVolumen
                ? "#1a0303"
                : faseTiempo === 0
                  ? "#1b4332"
                  : faseTiempo === 1
                    ? "#5c2400"
                    : "#070d1f",
          },
        ]}
      >
        {esSilencio ? (
          <View style={styles.pantallaApagadaContainer}>
            <Text style={styles.textoApagado}>💤 VOLUMEN EN 0%</Text>
            <Text style={styles.textoSubApagado}>
              Desliza la barra inferior para ver las etapas
            </Text>
          </View>
        ) : (
          <>
            {!perdistePorVolumen &&
              (faseTiempo === 2 ? (
                <View style={styles.lunaNocturna} />
              ) : (
                <View
                  style={[
                    styles.solCircular,
                    {
                      backgroundColor: faseTiempo === 1 ? "#ff7b00" : "#ffd166",
                    },
                  ]}
                />
              ))}

            {perdistePorVolumen && (
              <>
                <View
                  style={[
                    styles.nubeCeniza,
                    { top: 15, left: 20, width: 90, height: 25 },
                  ]}
                />
                <View
                  style={[
                    styles.nubeCeniza,
                    { top: 30, right: 30, width: 120, height: 30 },
                  ]}
                />
              </>
            )}

            <View
              style={[
                styles.montanaFondoIzq,
                perdistePorVolumen && styles.montanaCarbonizada,
              ]}
            />
            <View
              style={[
                styles.montanaFondoDer,
                perdistePorVolumen && styles.montanaCarbonizada,
              ]}
            />

            {perdistePorVolumen && (
              <Animated.View
                style={[
                  styles.meteoritoGiganteContenedor,
                  {
                    transform: [
                      { translateX: meteoritoGiganteX },
                      { translateY: meteoritoGiganteY },
                      { rotate: "-45deg" },
                    ],
                  },
                ]}
              >
                <View style={styles.estelaFuegoGigante} />
                <View style={styles.rocaMeteoritoGigante} />
              </Animated.View>
            )}

            <Animated.View
              style={[
                styles.pistaArboles,
                { transform: [{ translateX: posArbolesX }] },
              ]}
            >
              {[0, 160, 320].map((offset) => (
                <View
                  key={offset}
                  style={[styles.arbolGrupo, { left: offset + 20 }]}
                >
                  <View
                    style={[
                      styles.troncoArbol,
                      perdistePorVolumen && styles.troncoCarbonizado,
                    ]}
                  />
                  {!perdistePorVolumen && <View style={styles.copaHelecho1} />}
                  {!perdistePorVolumen && <View style={styles.copaHelecho2} />}
                  {perdistePorVolumen && (
                    <View style={styles.fuegoArbolQuemado} />
                  )}
                </View>
              ))}
            </Animated.View>

            <View style={styles.actorDino1}>{renderizarFaceta()}</View>

            {perdistePorVolumen && (
              <View style={styles.cartelDerrota}>
                <Text style={styles.textoDerrotaTitulo}>
                  PERDISTE POR EXCESO DE VOLUMEN
                </Text>
                <Pressable
                  style={styles.botonReintentar}
                  onPress={() => cambiarIntensidad(0)}
                >
                  <Text style={styles.textoReintentar}>REINICIAR</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        <View
          style={[
            styles.sueloPasto,
            (perdistePorVolumen || esSilencio) && styles.sueloCarbonizadoPasto,
          ]}
        />
        <View
          style={[
            styles.sueloTierra,
            (perdistePorVolumen || esSilencio) && styles.sueloCarbonizadoTierra,
          ]}
        />
        {perdistePorVolumen && <View style={styles.grietaLavaSuelo} />}
      </View>

      <View style={styles.cajaDialogo}>
        <Text style={styles.textoDialogo}>
          {actualInfo.titulo}: {actualInfo.desc}
        </Text>
      </View>

      <View style={styles.panelControl}>
        <Text style={styles.etiquetaControl}>
          {esSilencio
            ? "👆 SUBE EL VOLUMEN PARA AVANZAR"
            : perdistePorVolumen
              ? "☠️ ¡EXCESO DE VOLUMEN! ECOSISTEMA DESTRUIDO"
              : "DESLIZA PARA AVANZAR FACETAS Y ACELERAR"}
        </Text>

        <View
          style={styles.barraPista}
          onLayout={manejarLayoutBarra}
          {...panResponder.panHandlers}
        >
          <View
            pointerEvents="none"
            style={[
              styles.barraRelleno,
              {
                width: `${intensidad * 100}%`,
                backgroundColor: perdistePorVolumen
                  ? "#ff0054"
                  : esSilencio
                    ? "#1d3557"
                    : "#38b000",
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.perillaTactil,
              { left: `${Math.min(92, Math.max(0, intensidad * 92))}%` },
            ]}
          />
        </View>

        <View style={styles.filaAtajos}>
          <Pressable
            style={styles.botonAtajo}
            onPress={() => cambiarIntensidad(0)}
          >
            <Text style={styles.textoAtajo}>0%</Text>
          </Pressable>
          <Pressable
            style={styles.botonAtajo}
            onPress={() => cambiarIntensidad(0.15)}
          >
            <Text style={styles.textoAtajo}>HUEVO</Text>
          </Pressable>
          <Pressable
            style={styles.botonAtajo}
            onPress={() => cambiarIntensidad(0.3)}
          >
            <Text style={styles.textoAtajo}>NACE</Text>
          </Pressable>
          <Pressable
            style={styles.botonAtajo}
            onPress={() => cambiarIntensidad(0.65)}
          >
            <Text style={styles.textoAtajo}>MANADA</Text>
          </Pressable>
          <Pressable
            style={styles.botonAtajo}
            onPress={() => cambiarIntensidad(0.82)}
          >
            <Text style={styles.textoAtajo}>PELEA</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#060806",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  tituloArcade: {
    fontSize: 10,
    fontWeight: "900",
    color: "#52b788",
    letterSpacing: 1,
    textAlign: "center",
  },
  subtituloArcade: {
    fontSize: 9.5,
    color: "#ffb703",
    fontWeight: "bold",
    textAlign: "center",
  },
  marcadorPanel: {
    backgroundColor: "#111511",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#2d6a4f",
  },
  textoMarcador: {
    color: "#e9ecef",
    fontWeight: "bold",
    fontSize: 8.5,
  },
  pantallaArcade: {
    width: 320,
    height: 245,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#40916c",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  pantallaApagadaContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  textoApagado: {
    color: "#a8dadc",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
  textoSubApagado: {
    color: "#6c757d",
    fontSize: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  solCircular: {
    position: "absolute",
    top: 18,
    right: 32,
    width: 28,
    height: 28,
    borderRadius: 14,
    zIndex: 1,
  },
  lunaNocturna: {
    position: "absolute",
    top: 18,
    right: 32,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#f8f9fa",
    zIndex: 1,
  },
  nubeCeniza: {
    position: "absolute",
    backgroundColor: "rgba(30, 10, 5, 0.75)",
    borderRadius: 15,
    zIndex: 2,
  },
  montanaFondoIzq: {
    position: "absolute",
    bottom: 45,
    left: -25,
    width: 170,
    height: 85,
    backgroundColor: "#0b1f14",
    borderTopLeftRadius: 85,
    borderTopRightRadius: 70,
    zIndex: 2,
  },
  montanaFondoDer: {
    position: "absolute",
    bottom: 45,
    right: -30,
    width: 180,
    height: 95,
    backgroundColor: "#08170f",
    borderTopLeftRadius: 75,
    borderTopRightRadius: 90,
    zIndex: 2,
  },
  montanaCarbonizada: {
    backgroundColor: "#1e0805",
    borderTopWidth: 2,
    borderColor: "#ff4500",
  },
  meteoritoGiganteContenedor: {
    position: "absolute",
    width: 120,
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 6,
  },
  estelaFuegoGigante: {
    width: 90,
    height: 24,
    backgroundColor: "#ff3300",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rocaMeteoritoGigante: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#b22222",
    marginLeft: -12,
    borderWidth: 3,
    borderColor: "#ff4500",
  },
  pistaArboles: {
    position: "absolute",
    bottom: 45,
    width: 480,
    height: 60,
    zIndex: 3,
  },
  arbolGrupo: {
    position: "absolute",
    bottom: 0,
    width: 40,
    height: 50,
    alignItems: "center",
  },
  troncoArbol: {
    position: "absolute",
    bottom: 0,
    width: 6,
    height: 40,
    backgroundColor: "#3d2616",
  },
  troncoCarbonizado: { backgroundColor: "#110402" },
  copaHelecho1: {
    position: "absolute",
    top: 2,
    width: 32,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2d6a4f",
  },
  copaHelecho2: {
    position: "absolute",
    top: -4,
    width: 20,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#52b788",
  },
  fuegoArbolQuemado: {
    position: "absolute",
    top: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ff4500",
  },

  actorDino1: {
    position: "absolute",
    bottom: 45,
    left: 0,
    width: 320,
    height: 70,
    zIndex: 5,
    justifyContent: "flex-end",
  },
  escenaNidoContainer: { width: 320, height: 70, position: "relative" },
  escenaPelea: { width: 320, height: 70, position: "relative" },
  actorEntrada: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 100,
    height: 60,
  },
  huevoContainer: {
    position: "absolute",
    bottom: 0,
    left: 65,
    width: 30,
    height: 34,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  huevoForma: {
    width: 20,
    height: 26,
    backgroundColor: "#f4a261",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e76f51",
  },
  huevoRoto: {
    width: 22,
    height: 14,
    backgroundColor: "#f4a261",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e76f51",
  },

  dinoCaja: { width: 100, height: 60, position: "relative" },
  manadaCaja: { flexDirection: "row", alignItems: "flex-end", height: 60 },
  miembroManada: { width: 88, height: 60, position: "relative" },

  criaCola: {
    position: "absolute",
    bottom: 12,
    left: 10,
    width: 18,
    height: 6,
    backgroundColor: "#2a9d8f",
    borderRadius: 3,
    transform: [{ rotate: "12deg" }],
  },
  criaCuerpo: {
    position: "absolute",
    bottom: 8,
    left: 24,
    width: 28,
    height: 16,
    backgroundColor: "#2a9d8f",
    borderRadius: 8,
  },
  criaCabeza: {
    position: "absolute",
    bottom: 16,
    left: 46,
    width: 16,
    height: 12,
    backgroundColor: "#2a9d8f",
    borderRadius: 6,
  },
  criaPata1: {
    position: "absolute",
    bottom: 0,
    left: 28,
    width: 6,
    height: 9,
    backgroundColor: "#185e55",
    borderRadius: 2,
  },
  criaPata2: {
    position: "absolute",
    bottom: 0,
    left: 42,
    width: 6,
    height: 9,
    backgroundColor: "#21867a",
    borderRadius: 2,
  },

  estegoCola: {
    position: "absolute",
    bottom: 16,
    left: 2,
    width: 32,
    height: 9,
    backgroundColor: "#9b5de5",
    borderRadius: 4,
    transform: [{ rotate: "10deg" }],
  },
  estegoCuerpo: {
    position: "absolute",
    bottom: 12,
    left: 28,
    width: 48,
    height: 24,
    backgroundColor: "#9b5de5",
    borderRadius: 12,
  },
  estegoCuello: {
    position: "absolute",
    bottom: 20,
    left: 68,
    width: 12,
    height: 10,
    backgroundColor: "#9b5de5",
    borderRadius: 4,
    transform: [{ rotate: "-15deg" }],
  },
  estegoCabeza: {
    position: "absolute",
    bottom: 18,
    left: 76,
    width: 16,
    height: 10,
    backgroundColor: "#9b5de5",
    borderRadius: 4,
  },
  estegoPlaca1: {
    position: "absolute",
    bottom: 35,
    left: 34,
    width: 8,
    height: 11,
    backgroundColor: "#f15bb5",
    transform: [{ rotate: "-10deg" }],
  },
  estegoPlaca2: {
    position: "absolute",
    bottom: 35,
    left: 50,
    width: 8,
    height: 11,
    backgroundColor: "#f15bb5",
    transform: [{ rotate: "10deg" }],
  },
  estegoPata1: {
    position: "absolute",
    bottom: 0,
    left: 34,
    width: 8,
    height: 13,
    backgroundColor: "#7209b7",
    borderRadius: 3,
  },
  estegoPata2: {
    position: "absolute",
    bottom: 0,
    left: 58,
    width: 8,
    height: 13,
    backgroundColor: "#7209b7",
    borderRadius: 3,
  },

  triceratopsCola: {
    position: "absolute",
    bottom: 18,
    left: 4,
    width: 28,
    height: 9,
    backgroundColor: "#e76f51",
    borderRadius: 4,
    transform: [{ rotate: "15deg" }],
  },
  triceratopsCuerpo: {
    position: "absolute",
    bottom: 12,
    left: 26,
    width: 48,
    height: 26,
    backgroundColor: "#e76f51",
    borderRadius: 13,
  },
  triceratopsEscudo: {
    position: "absolute",
    bottom: 22,
    left: 64,
    width: 12,
    height: 24,
    backgroundColor: "#f4a261",
    borderRadius: 6,
    transform: [{ rotate: "-15deg" }],
  },
  triceratopsCabeza: {
    position: "absolute",
    bottom: 16,
    left: 72,
    width: 20,
    height: 14,
    backgroundColor: "#e76f51",
    borderRadius: 5,
  },
  triceratopsPata1: {
    position: "absolute",
    bottom: 0,
    left: 34,
    width: 9,
    height: 13,
    backgroundColor: "#b5492e",
    borderRadius: 3,
  },
  triceratopsPata2: {
    position: "absolute",
    bottom: 0,
    left: 58,
    width: 9,
    height: 13,
    backgroundColor: "#b5492e",
    borderRadius: 3,
  },

  braquioCola: {
    position: "absolute",
    bottom: 20,
    left: 2,
    width: 34,
    height: 8,
    backgroundColor: "#4ea8de",
    borderRadius: 4,
    transform: [{ rotate: "12deg" }],
  },
  braquioCuerpo: {
    position: "absolute",
    bottom: 13,
    left: 26,
    width: 42,
    height: 24,
    backgroundColor: "#4ea8de",
    borderRadius: 12,
  },
  braquioCuello: {
    position: "absolute",
    bottom: 26,
    left: 58,
    width: 10,
    height: 26,
    backgroundColor: "#4ea8de",
    borderRadius: 5,
    transform: [{ rotate: "-22deg" }],
  },
  braquioCabeza: {
    position: "absolute",
    bottom: 48,
    left: 64,
    width: 18,
    height: 10,
    backgroundColor: "#48bfe3",
    borderRadius: 4,
  },
  braquioPata1: {
    position: "absolute",
    bottom: 0,
    left: 32,
    width: 8,
    height: 14,
    backgroundColor: "#277da1",
    borderRadius: 3,
  },
  braquioPata2: {
    position: "absolute",
    bottom: 0,
    left: 52,
    width: 8,
    height: 14,
    backgroundColor: "#277da1",
    borderRadius: 3,
  },

  teroCola: {
    position: "absolute",
    bottom: 22,
    left: 2,
    width: 34,
    height: 9,
    backgroundColor: "#2a9d8f",
    borderRadius: 4,
    transform: [{ rotate: "12deg" }],
  },
  teroCuerpo: {
    position: "absolute",
    bottom: 14,
    left: 28,
    width: 38,
    height: 22,
    backgroundColor: "#2a9d8f",
    borderRadius: 11,
  },
  teroCuello: {
    position: "absolute",
    bottom: 28,
    left: 56,
    width: 10,
    height: 18,
    backgroundColor: "#2a9d8f",
    borderRadius: 5,
    transform: [{ rotate: "-25deg" }],
  },
  teroCresta: {
    position: "absolute",
    bottom: 46,
    left: 60,
    width: 14,
    height: 7,
    backgroundColor: "#e9c46a",
    borderRadius: 3,
    transform: [{ rotate: "-15deg" }],
  },
  teroCabeza: {
    position: "absolute",
    bottom: 40,
    left: 62,
    width: 20,
    height: 11,
    backgroundColor: "#2a9d8f",
    borderRadius: 5,
  },
  teroPataTrasera: {
    position: "absolute",
    bottom: 0,
    left: 34,
    width: 8,
    height: 15,
    backgroundColor: "#185e55",
    borderRadius: 3,
  },
  teroPataDelantera: {
    position: "absolute",
    bottom: 0,
    left: 50,
    width: 8,
    height: 15,
    backgroundColor: "#21867a",
    borderRadius: 3,
  },

  rexCola: {
    position: "absolute",
    bottom: 20,
    left: 2,
    width: 34,
    height: 9,
    backgroundColor: "#c1121f",
    borderRadius: 4,
    transform: [{ rotate: "12deg" }],
  },
  rexCuerpo: {
    position: "absolute",
    bottom: 14,
    left: 28,
    width: 42,
    height: 25,
    backgroundColor: "#c1121f",
    borderRadius: 12,
  },
  rexCabeza: {
    position: "absolute",
    bottom: 32,
    left: 56,
    width: 28,
    height: 16,
    backgroundColor: "#780000",
    borderRadius: 5,
  },
  rexPata1: {
    position: "absolute",
    bottom: 0,
    left: 34,
    width: 9,
    height: 14,
    backgroundColor: "#590000",
    borderRadius: 3,
  },
  rexPata2: {
    position: "absolute",
    bottom: 0,
    left: 54,
    width: 9,
    height: 14,
    backgroundColor: "#780000",
    borderRadius: 3,
  },

  dinoCenizas: {
    width: 65,
    height: 25,
    position: "relative",
    alignItems: "center",
    marginLeft: 110,
  },
  cenizaCuerpo: {
    position: "absolute",
    bottom: 0,
    width: 48,
    height: 14,
    backgroundColor: "#141111",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#332211",
  },
  cenizaCabeza: {
    position: "absolute",
    bottom: 11,
    left: 32,
    width: 15,
    height: 9,
    backgroundColor: "#141111",
    borderRadius: 4,
  },
  particulaCeniza1: {
    position: "absolute",
    top: -6,
    left: 10,
    width: 5,
    height: 5,
    backgroundColor: "#ff4500",
    borderRadius: 2.5,
  },
  particulaCeniza2: {
    position: "absolute",
    top: -10,
    left: 25,
    width: 3,
    height: 3,
    backgroundColor: "#ff6347",
    borderRadius: 1.5,
  },

  cartelDerrota: {
    position: "absolute",
    top: 24,
    backgroundColor: "rgba(15, 0, 0, 0.9)",
    borderWidth: 2,
    borderColor: "#ff0054",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    zIndex: 10,
  },
  textoDerrotaTitulo: {
    color: "#ff4d6d",
    fontSize: 9.5,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  botonReintentar: {
    backgroundColor: "#ff0054",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  textoReintentar: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },

  sueloPasto: {
    position: "absolute",
    bottom: 38,
    width: "100%",
    height: 8,
    backgroundColor: "#40916c",
    zIndex: 6,
  },
  sueloCarbonizadoPasto: { backgroundColor: "#150202" },
  sueloTierra: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 38,
    backgroundColor: "#2b1d14",
    zIndex: 6,
  },
  sueloCarbonizadoTierra: { backgroundColor: "#080101" },
  grietaLavaSuelo: {
    position: "absolute",
    bottom: 16,
    left: 110,
    width: 90,
    height: 4,
    backgroundColor: "#ff4500",
    borderRadius: 2,
    zIndex: 6,
  },

  cajaDialogo: {
    backgroundColor: "#111511",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#ffb703",
  },
  textoDialogo: {
    color: "#ffb703",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  panelControl: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#111511",
    padding: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#2d6a4f",
    gap: 8,
    alignItems: "center",
  },
  etiquetaControl: {
    color: "#d8f3dc",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  barraPista: {
    width: 290,
    height: 24,
    backgroundColor: "#000",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#52b788",
    overflow: "hidden",
    justifyContent: "center",
    position: "relative",
  },
  barraRelleno: { height: "100%" },
  perillaTactil: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
  },
  filaAtajos: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 4,
  },
  botonAtajo: {
    flex: 1,
    backgroundColor: "#1b261b",
    paddingVertical: 5,
    alignItems: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#40916c",
  },
  textoAtajo: { color: "#fff", fontSize: 6.5, fontWeight: "bold" },
});
