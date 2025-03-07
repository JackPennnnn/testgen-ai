// esbuild 配置
const esbuild = require('esbuild')
const path = require('path')
const config = {
    entryPoints: [path.resolve(__dirname, '../src/cli.js')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: path.resolve(__dirname, '../build/cli.js'),
    minify: true,
    format: 'cjs',
    sourcemap: false,
    external: [
        // 需要外部化的核心模块
        'child_process',
        'fs',
        'path',
        'os',
        'commander',
        'chalk',
        'ora',
        'inquirer',
        '@babel/*',
        'openai',
        'crypto',
        'recast'
    ],
    logLevel: 'info'
}

esbuild.build(config)
    .then(() => console.log('Build completed!'))
    .catch(() => process.exit(1));
