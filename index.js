const path = require('path');
const url = require('url');
const mime = require('mime-types');
const fs = require('fs');

function manifestor (opts) {
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

function pusher () {
    return function (ctx, next) {
        const { res, req, state } = ctx;

        function push (file) {
            const opts = {
                request: {
                    accept: '*/*'
                },
                response: {
                    'content-type': mime.lookup(file)
                }
            };

            const p = res.push(file, opts, (_, stream) => {
                function cleanup (err) {
                    if (err) {
                        console.error(err.stack);
                    }
                }

                stream.on('error', cleanup);
                stream.on('close', cleanup);
                stream.on('finish', cleanup);
            });

            const content = fs.createReadStream(path.resolve('.', file.replace(/^\//, '')));
            content.pipe(p);
        }

        if (req.url === '/') {
            Object.keys(state.h2).map(push);
        }

        return next();
    }
}

module.exports = { manifestor, pusher };
