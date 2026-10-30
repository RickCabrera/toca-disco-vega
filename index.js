import { AppRegistry } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';

// appName tiene que ser el id del componente interactivo de manifest.toml:
// Vega busca la app por ese texto.
AppRegistry.registerComponent(appName, () => App);
