const path = require('path');
const url = require('url');
const mime = require('mime-types');
const fs = require('fs');
const zlib = require('zlib');

function manifestor (opts = {}) {
    const manifest = require(path.resolve('.', opts.manifest));

    return function (ctx, next) {
        const { host, protocol, res, req, state } = ctx;

        if (req.url !== '/') {
            return next();
        }

        const links = Object.keys(manifest).map(key => {
            const { type } = manifest[key];
            const u = url.resolve(`${protocol}://${host}`, key);
            return `<${u}>; rel=preload; as=${type}`;
        });

        ctx.set('Link', links.join(', '));
        state.h2 = manifest;

        return next();
    }
}

function pusher (opts = {}) {
    return function (ctx, next) {
        function push (key) {
            const popts = {
                request: {
                    accept: '*/*'
                },
                response: {
                    'server': 'koa-h2-man-push',
                    'content-type': mime.lookup(key),
                    'content-encoding': 'gzip'
                }
            };

            const content = fs.createReadStream(path.join((opts.root || '.'), key));
            const p = ctx.res.push(key, popts);

            content.pipe(zlib.createGzip()).pipe(p);

            p.on('error', err => {
                console.error(err);
            });

            return p;
        }

        return next().then(() => {
            // no manifest? nothing to push. move along!
            if (!ctx.state.h2) {
                return;
            }

            Object.keys(ctx.state.h2).forEach(push);
        });
    }
}

module.exports = { manifestor, pusher };
