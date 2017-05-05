//
//  rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  format: 'iife',
  plugins: [
    nodeResolve(), //  import external scripts from NPM
    commonjs() // convert CommonJS modules to ES6
  ]
};
