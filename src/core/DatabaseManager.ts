import { createPool, Pool } from 'mysql'

export class DatabaseManager {

    // todo sanitize inputs

    private connection: Pool

    public constructor() {
        this.connection = createPool({
            host: 'localhost',
            user: 'DiscordBots',
            password: process.env.sqlPass,
            database: 'discord_data'
        })
    }

    public select(table: string, callback: (results: unknown[]) => void): void {
        this.connection.query(`SELECT * FROM ${table} AS solution`, (error, results) => {
            if (error) {
                return
            }
            return callback(results)
        })
    }

    public customSelect(table: string, sort: string, callback: (results: unknown[]) => void): void {
        this.connection.query(`SELECT * FROM ${table} AS solution ORDER BY \`${sort}\``, (error, results) => {
            if (error) {
                return
            }
            return callback(results)
        })
    }

    public insert(table: string, data: Map<string, string>): void {
        let columns
        let values
        for(const [ column, value ] of data) {
            if (!columns) {
                columns = `\`${column}\``
                values = `'${value}'`
                continue
            }
            columns += `, \`${column}\``
            values += `, '${value}'`
        }
        this.connection.query(`INSERT INTO ${table} (${columns}) VALUES (${values})`, (error) => {
            if (error) {
                console.warn(error)
            }
        })
    }
}