import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';
// import fcbk from './modules/fcbk';
// import twttr from './modules/twttr';

autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

makeMap($('#map'));

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);
