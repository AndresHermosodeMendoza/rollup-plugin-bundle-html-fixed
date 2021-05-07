# rollup-plugin-bundle-html-fixed
This is a modification of the original plugin (https://github.com/haifeng2013/rollup-plugin-bundle-html).
Trying to fix the typeError: 'isEntry' of undefined from https://github.com/haifeng2013/rollup-plugin-bundle-html/issues/31
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
