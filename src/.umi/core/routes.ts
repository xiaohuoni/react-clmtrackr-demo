// @ts-nocheck
import { ApplyPluginsType } from '/Users/xiaohuoni/Desktop/umi-watch-test/node_modules/@umijs/runtime';
import { plugin } from './plugin';

const routes = [
  {
    "path": "/",
    "exact": true,
    "component": require('@/pages/index.js').default
  }
];

// allow user to extend routes
plugin.applyPlugins({
  key: 'patchRoutes',
  type: ApplyPluginsType.event,
  args: { routes },
});

export { routes };
