import { Connection, createConnection } from 'mysql'
import { secrets } from './utils/constants'

export class DatabaseManager {

    private connection: Connection

    public constructor() {
        this.connect()
        this.connection.on('error', () => {
            this.connection.end()
            this.connect()
        })
    }

    private connect() {
        this.connection = createConnection({
            host: 'localhost',
            user: 'DiscordBots',
            password: secrets.sqlPass,
            database: 'discord_data'
        })

        this.connection.connect()
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
                console.log(error)
            }
        })
    }
}