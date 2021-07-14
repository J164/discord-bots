import { Connection, createConnection } from 'mysql'
import { sysData } from './common'

export class DatabaseManager {

    private connection: Connection

    public constructor() {
        this.connection = createConnection({
            host: 'localhost',
            user: 'DiscordBots',
            password: sysData.sqlPass,
            database: 'discord_data'
        })

        this.connection.connect()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public select(table: string, callback: (results: any) => void): void {
        this.connection.query(`SELECT * FROM ${table} AS solution`, (error, results) => {
            if (error) {
                return
            }
            return callback(results)
        })
    }

    public insert(table: string, data: Map<string, string>, callback: (success: boolean) => void): void {
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
                console.log(error)
                return callback(false)
            }
            return callback(true)
        })
    }

    public end(): void {
        this.connection.end()
    }
}