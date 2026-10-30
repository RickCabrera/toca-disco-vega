# La app para Fire TV con Vega OS

Los Fire TV más nuevos de Amazon **no son Android**: corren Vega OS, que está basado en Linux. Ahí
el APK de la tele no se instala, ni con Downloader ni con nada. Son, por ahora:

| Equipo | Modelo |
|---|---|
| Fire TV Stick 4K Select (2025) | `AFTCA002` |
| Fire TV Stick HD (2026) | `AFTCL001` |

Para saber si un Fire TV es Vega: en **Configuración → Mi Fire TV → Opciones para
desarrolladores**, si aparece un código QR que lleva a `developer.amazon.com/apps-and-games/vega`,
es Vega.

Este repositorio es la app para esos equipos. Hace lo mismo que la de Android TV (en el repo privado Rockola, carpeta `android-tv/`): abre `/tv` a pantalla
completa en un WebView, la música y el video arrancan solos, **Atrás** no la cierra y sin internet
reintenta sola. Abre `/tv?app=vega`: ese parámetro le dice a la página que no muestre «Iniciar».

Lo que **no** puede hacer en Vega, porque Amazon no da cómo: abrirse sola al prender la tele.
Después de reiniciar el equipo alguien tiene que abrir **Toca Disco** una vez.

## Conseguir el paquete (.vpkg)

1. En GitHub, en **Actions → App de Vega OS** de este repositorio, abre la corrida más reciente con palomita verde (o
   pulsa **Run workflow**; ahí puedes escribir otra dirección de `/tv`).
2. Baja el artefacto **toca-disco-vega**. Es un `.zip` con `toca-disco-vega_armv7.vpkg` (o un
   nombre parecido) adentro. Los Fire TV Stick son **armv7**.

No hay link directo como el del APK: un `.vpkg` no se instala bajándolo en la tele.

## Lo que se hace a mano con Amazon

Hay dos caminos. Para probar en una tele, el **A**. Para los locales, el **B**.

### Paso 0: la cuenta de desarrollador (para los dos caminos)

1. Entra a <https://developer.amazon.com> y crea la cuenta (es gratis). Usa un correo de la
   empresa, no uno personal: la app queda a nombre de esa cuenta.
2. Llena el perfil de desarrollador (nombre de la empresa, dirección, teléfono). Para publicar en
   la Appstore, después te va a pedir datos fiscales y de pago, aunque la app sea gratis.

### A. Instalarla en una tele con el modo desarrollador

Necesitas una computadora **Mac o Linux** (Windows no está soportado por el instalador de Amazon)
en la **misma red** que la tele.

1. En la computadora instala el SDK de Vega:

   ```bash
   curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash
   source ~/vega/env
   vega -v
   ```

2. En la tele: **Configuración → Mi Fire TV → Acerca de**, pulsa 7 veces el botón central sobre el
   nombre del equipo. Luego **Opciones para desarrolladores → Modo para desarrolladores** y
   **Continuar**. La tele muestra un código de 6 dígitos.
3. En la computadora:

   ```bash
   vega devmode login                         # abre el navegador: entra con la cuenta del paso 0
   vega devmode enable-device --code 123456   # el código que muestra la tele
   ```

   La tele se reinicia y queda en modo desarrollador.
4. Instala y abre la app. Con el `.vpkg` bajado de Actions:

   ```bash
   vega device list                                    # debe aparecer la tele
   vega device install-app --packagePath toca-disco-vega_armv7.vpkg
   vega device launch-app --appName mx.tocadisco.vega.main
   ```

   Si los nombres de las opciones cambiaron, `vega device install-app --help` los muestra. También
   se puede compilar e instalar desde el código, en la raíz de este repositorio:

   ```bash
   npm install
   npm run build:release
   npm run install:release
   npm run launch
   ```

5. En la tele aparece el código de 6 caracteres de Toca Disco: vincula la pantalla desde el panel,
   en **Pantallas**.

Hay que repetir los pasos 2 a 4 en cada tele. Por eso para los locales conviene el camino B.

### B. Publicarla en la Appstore de Amazon

Así cualquier Fire TV con Vega la baja de la tienda, como cualquier app, sin modo desarrollador.

1. En <https://developer.amazon.com/apps-and-games/console> elige **Add new app → Fire TV** y
   después la opción de **Vega**.
2. Sube el `.vpkg` de Actions (el **release**, armv7).
3. Llena la ficha:
   - **Nombre:** Toca Disco.
   - **Ícono:** `assets/image/app_icon_512.png` (512×512). La consola puede pedir otros
     tamaños y capturas de pantalla de la tele (1920×1080): tómalas con la app abierta.
   - **Descripción, categoría** (Música o Negocios), **clasificación de contenido** y **política de
     privacidad** (una URL; puede ser una página del sitio de Toca Disco).
   - **Países:** México (y los que quieras).
   - **Precio:** gratis.
   - Si no quieres que cualquiera la encuentre, la consola tiene **pruebas en vivo (Live App
     Testing)**: la app solo la ven los correos que invites. Sirve para los locales sin publicarla
     abierta.
4. Envíala a revisión. Amazon tarda unos días. Si la rechazan, el correo dice por qué.

Cada versión nueva se sube igual, con `version` más alto en `manifest.toml` y en
`package.json`.

## Notas técnicas

- React Native 0.72 y `@amazon-devices/react-native-kepler` 2.x: es el runtime de los equipos con
  Vega OS 1.2 (`IKeplerScript_2_0` en el manifest). No subir a Kepler 4 / RN 0.83 sin probar en
  un equipo.
- Compila para **armv7**. `aarch64` es solo el simulador en una Mac con Apple Silicon.
- `manifest.toml` declara los servicios de video, audio y DRM: sin ellos el WebView no reproduce
  el video de YouTube.
- La configuración (versiones, manifest y el arreglo de `metro-babel-transformer.js`) sale de
  [ScreenTinker](https://github.com/screentinker/screentinker/tree/main/vega), MIT, que ya corrió
  en un Fire TV Stick 4K Select.
- Casi todos los cambios de Toca Disco llegan solos: la app solo muestra la página. Se reinstala
  únicamente cuando cambia algo de este repositorio.

## De dónde sale

Es una copia de la carpeta `vega-tv/` del repo privado Rockola. Vive aquí, en público, para compilar en GitHub Actions sin gastar minutos. No tiene nada secreto: solo abre `https://www.tocadisco.com.mx/tv`.
