const path = require('path');
const url = require('url');
const mime = require('mime-types');
const fs = require('fs');

function middleware (opts = {}) {
    const options = Object.assign({
        manifest: 'push_manifest.json',
        root: '.'
    }, opts);

    const manifest = require(path.resolve(options.root, options.manifest));

    return function (ctx, next) {
        const { host, protocol, res, req } = ctx;

        if (req.url !== '/') return next();

        function push (key) {
            const popts = {
                request: {
                    accept: '*/*'
                },
                response: {
                    'server': 'koa-h2-man-push',
                    'content-type': mime.lookup(key)
                }
            };

            const p = ctx.res.push(key, popts);
            const content = fs.createReadStream(path.resolve(options.root, key.slice(1)));

            content.pipe(p);

            p.on('error', console.error);

            return p;
        }

        const links = Object.keys(manifest).map(key => {
            const type = manifest[key].type;
            const u = url.resolve(`${protocol}://${host}`, key);
            return `<${u}>; rel=preload; as=${type}`;
        });

        ctx.set('Link', links.join(', '));

        return next().then(() => {
            Object.keys(manifest).forEach(push);
        });
    }
}

module.exports = middleware;
