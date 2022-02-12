import { readdirSync } from "fs";

const commands = []
for (const dir of readdirSync('./dist/commands')) {
    for (const command of readdirSync(`./dist/commands/${dir}`).filter(file => file.endsWith('.js'))) {
        commands.push(`${dir}/${command}`)
    }
}

for (const command of commands) {
    await import(`../dist/commands/${command}`)
}