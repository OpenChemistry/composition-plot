import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';

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
            copy({
                targets: [
                    { src: 'src/index.html', dest: 'dist' },
                ]
            })
        ]
    }
]