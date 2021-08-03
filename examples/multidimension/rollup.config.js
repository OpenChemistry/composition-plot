import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js'
            }
        ],
        plugins: [
            json(),
            resolve(),
            commonJS(),
            typescript({ target: 'esnext', declaration: false }),
            getBabelOutputPlugin({ presets: ['@babel/preset-env'] }),
            copy({
                targets: [
                    { src: 'src/index.html', dest: 'dist' },
                    { src: '../data/samples.json', dest: 'dist' },
                ]
            })
        ]
    }
]