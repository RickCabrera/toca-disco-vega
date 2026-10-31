/**
 * La única pantalla de la app: un WebView a pantalla completa que abre /tv de Toca Disco
 * y la mantiene viva. Es la misma idea que la app de Android TV (android-tv/), para los
 * Fire TV con Vega OS, donde el APK no se instala.
 *
 * - La música y el video arrancan solos (sin clic en «Iniciar»).
 * - Atrás no cierra la app. Para salir, el botón de inicio (casita).
 * - Sin internet avisa «Sin conexión, reintentando…» y reintenta sola.
 * - Pide al sistema no mandarla a segundo plano ni poner el protector de pantalla.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { WebView } from '@amazon-devices/webview';
import { LIFESPAN_POLICY, useSetLifespanCallback, useSetTimeoutCallback } from '@amazon-devices/react-native-kepler';
import { APP_PARAM, TV_URL } from './config';

const RETRY_MIN_MS = 3000;
const RETRY_MAX_MS = 60000;

const withAppParam = (url: string) => url + (url.indexOf('?') === -1 ? '?' : '&') + APP_PARAM;

/** ¿La dirección es la de la página /tv (con o sin ?app=vega), y no un recurso de adentro? */
const isTvPage = (url: string) => {
  const base = url.split('#')[0].split('?')[0].replace(/\/+$/, '');
  const tv = TV_URL.split('?')[0].replace(/\/+$/, '');
  // Sin dirección no sabemos qué falló: mejor no recargar.
  return base !== '' && (base === tv || base.endsWith('/tv'));
};

export const App = () => {
  const webRef = useRef<any>(null);
  const [offline, setOffline] = useState(false);
  // Cambiarla vuelve a montar el WebView: es la forma más segura de recargar.
  const [attempt, setAttempt] = useState(0);
  const retryMs = useRef(RETRY_MIN_MS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLifespan = useSetLifespanCallback();
  const setInactivityTimeout = useSetTimeoutCallback();
  useEffect(() => {
    try {
      setLifespan(LIFESPAN_POLICY.PERMANENT);
      // Segundos: un año sin tocar el control y la app sigue al frente.
      setInactivityTimeout(60 * 60 * 24 * 365);
    } catch (e) {
      // manifest.toml pide lo mismo (lifespan y timeout-secs).
    }
  }, [setLifespan, setInactivityTimeout]);

  // En un local nadie va a volver a abrir la app si Atrás la cierra.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const retryLater = useCallback(() => {
    setOffline(true);
    if (timer.current) clearTimeout(timer.current);
    const wait = retryMs.current;
    retryMs.current = Math.min(wait * 2, RETRY_MAX_MS);
    timer.current = setTimeout(() => setAttempt((n) => n + 1), wait);
  }, []);

  // El WebView de Vega avisa onError también cuando falla un recurso de adentro (una imagen,
  // algo del reproductor de YouTube), y no dice si fue la página principal. Si recargáramos
  // por eso, la música se corta cada rato. Una vez que /tv cargó, la página se reconecta sola;
  // la app solo reintenta si lo que falló es la página misma.
  const pageLoaded = useRef(false);

  const loaded = useCallback(() => {
    pageLoaded.current = true;
    retryMs.current = RETRY_MIN_MS;
    setOffline(false);
  }, []);

  const failed = useCallback(
    (event: any) => {
      const url: string = (event && event.nativeEvent && event.nativeEvent.url) || '';
      if (pageLoaded.current && !isTvPage(url)) return;
      pageLoaded.current = false;
      retryLater();
    },
    [retryLater],
  );

  return (
    <View style={styles.root}>
      <WebView
        key={attempt}
        ref={webRef}
        style={styles.web}
        source={{ uri: withAppParam(TV_URL) }}
        hasTVPreferredFocus={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // Sin esto el video se queda en pausa hasta que alguien pulse el control.
        mediaPlaybackRequiresUserAction={false}
        // El reproductor de YouTube vive en otro dominio y necesita sus cookies.
        thirdPartyCookiesEnabled={true}
        allowSystemKeyEvents={true}
        onLoad={loaded}
        onError={failed}
      />
      {offline ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Sin conexión, reintentando…</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  web: { flex: 1, backgroundColor: '#000000' },
  notice: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c0c26',
    padding: 48,
  },
  noticeText: { color: '#ffffff', fontSize: 40, textAlign: 'center' },
});
