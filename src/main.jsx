// src/main.jsx
import { h, render } from 'preact';
import App from './App.jsx';
import './styles/fonts.css'; // Montserrat global

render(<App />, document.getElementById('app'));
