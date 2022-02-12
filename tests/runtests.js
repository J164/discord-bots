import { readdirSync } from "fs";

for (const test of readdirSync('./tests').filter(file => file.endsWith('test.js'))) {
    await import(`./${test}`);
}