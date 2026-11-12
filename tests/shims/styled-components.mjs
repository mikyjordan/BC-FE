/**
 * Nei test (Jest in modalità moduli ES) styled-components, pubblicato in CommonJS, arriva come
 * oggetto: qui si riespone con l'export predefinito corretto, come lo vede webpack.
 */
import sc from '../../node_modules/styled-components/dist/styled-components.browser.cjs.js';

export default sc.default;
export const { ThemeProvider, ServerStyleSheet, StyleSheetManager, createGlobalStyle, css, keyframes, useTheme, isStyledComponent, withTheme } = sc;
