// Entry point: draws what all modes share, then loads the page for this mode.

import { drawChrome, mode } from './page.js';

drawChrome();
await import(mode === 'lineup' ? './lineup.js' : './game.js');
