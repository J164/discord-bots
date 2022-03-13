import { Db, Filter, MongoClient, WithId, Document } from 'mongodb'
import process from 'node:process'

export class DatabaseManager {

    private readonly _client: MongoClient
    private _database: Db

    public constructor() {
        this._client = new MongoClient(`mongodb+srv://DiscordBots:${process.env.DBPASS}@cluster0.3fm3u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
    }

    public async connect(): Promise<void> {
        await this._client.connect()
        this._database = this._client.db('botdata')
    }

    public select(collection: string, filter?: Filter<Document>): Promise<WithId<Document>[]> {
        return this._database.collection(collection).find(filter ?? {}).toArray()
    }

    public async insert(collection: string, data: Document): Promise<void> {
        await this._database.collection(collection).insertOne(data)
    }
}
