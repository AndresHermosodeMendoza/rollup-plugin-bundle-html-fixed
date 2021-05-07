# rollup-plugin-bundle-html-fixed
Trying to fix the typeError: 'isEntry' of undefined from https://github.com/haifeng2013/rollup-plugin-bundle-html
Just the file with some changes.

I left also my rollup.config.js

        html({
            template: './index.html',
            dest: "./dist/",
            filename: 'index.html',
            inject: 'head',
            sourcemap: false,
            externals: [
                { type: 'css', file: "./bundle.css", pos: 'before' }
              
            ]
        })
