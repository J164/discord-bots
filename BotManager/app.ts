import * as exec from 'child_process'

const src = '../src'

exec.fork(`${src}/PotatoBot/app.js`)
exec.fork(`${src}/SwearBot/app.js`)
exec.fork(`${src}/KrenkoBot/app.js`)
exec.fork(`${src}/YeetBot/app.js`)