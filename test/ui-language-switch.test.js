'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/ui/i18n.js'), 'utf8');
function setup(href, storageBlocked = false) {
  const storage = new Map(), navigations = [];
  const location = { href, replace: value => navigations.push(value), search: new URL(href).search };
  const context = vm.createContext({ location, navigator: { language: 'vi' }, URL, URLSearchParams, document: { documentElement: {} }, window: {},
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => { if (storageBlocked) throw Error('Storage blocked'); storage.set(key, value); } } });
  vm.runInContext(source, context);
  return { switchTo: lang => context.window.AgentMeetingI18n.setLang(lang), navigations, storage };
}
test('language switching without a query language navigates to the explicit chosen locale', () => {
  const f = setup('http://127.0.0.1:3181/m/fixture#results'); f.switchTo('en');
  assert.equal(f.navigations[0], '/m/fixture?lang=en#results'); assert.equal(f.storage.get('agent-meeting:lang'), 'en');
});
test('language switching preserves the current view and other query parameters', () => {
  const f = setup('http://127.0.0.1:3181/m/fixture/admin?section=runtime&lang=en#results'); f.switchTo('vi');
  assert.equal(f.navigations[0], '/m/fixture/admin?section=runtime&lang=vi#results');
});
test('chosen language remains navigable when browser storage is blocked', () => {
  const f = setup('http://127.0.0.1:3181/m/fixture#execute', true); f.switchTo('en');
  assert.equal(f.navigations[0], '/m/fixture?lang=en#execute');
});
