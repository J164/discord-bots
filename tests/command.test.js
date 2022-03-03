import { readdirSync } from "fs";

for (const dir of readdirSync('./dist/commands')) {
    for (const command of readdirSync(`./dist/commands/${dir}`).filter(file => file.endsWith('.js'))) {
        await import(`../dist/commands/${dir}/${command}`)
    }
}