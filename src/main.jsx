import { h } from 'preact';
import { render } from 'preact';
import App from './App';

// Tipografía y base global
import './styles/index.css';

// Estilos de la landing (tu hoja ya trabajada)
import './styles/LandingPage.css';

render(<App />, document.getElementById('app'));
