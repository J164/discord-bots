import { Db, Filter, MongoClient, WithId, Document } from 'mongodb'
import process from 'node:process'

export class DatabaseManager {

    private readonly client: MongoClient
    private database: Db
    public offline: boolean

    public constructor() {
        this.offline = true
        this.client = new MongoClient(`mongodb+srv://DiscordBots:${process.env.DBPASS}@cluster0.3fm3u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
    }

    public async connect(): Promise<void> {
        await this.client.connect()
        this.database = this.client.db('botdata')
        this.offline = false
    }

    public async select(collection: string, filter?: Filter<Document>): Promise<WithId<Document>[]> {
        return this.database.collection(collection).find(filter ?? {}).toArray()
    }

    public async insert(collection: string, data: Document): Promise<void> {
        await this.database.collection(collection).insertOne(data)
    }
}
