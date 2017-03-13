const Koa = require('koa');
const statik = require('koa-static');
const spdy = require('spdy');
const fs = require('fs');
const push = require('../../');

const koa = new Koa();

koa
    .use(push({ manifest: 'manifest.json' }))
    .use(statik('.'));


const server = spdy.createServer({
    key: fs.readFileSync(`${__dirname}/dev.key`),
    cert: fs.readFileSync(`${__dirname}/dev.crt`)
}, koa.callback());

server.listen(3000);
