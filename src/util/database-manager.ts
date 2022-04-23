import { Db, Filter, MongoClient, WithId, Document } from 'mongodb';
import { env } from 'node:process';

export class DatabaseManager {
  private readonly _client: MongoClient;
  private readonly _database: Db;

  public constructor() {
    this._client = new MongoClient(env.MONGODB_URL);
    this._database = this._client.db('botdata');
  }

  public async connect(): Promise<void> {
    await this._client.connect();
  }

  public findMany(collection: string, filter?: Filter<Document>): Promise<WithId<Document>[]> {
    return this._database
      .collection(collection)
      .find(filter ?? {})
      .toArray();
  }

  public async insertOne(collection: string, data: Document): Promise<void> {
    await this._database.collection(collection).insertOne(data);
  }

  public findOne(collection: string, filter?: Filter<Document>): Promise<WithId<Document>> {
    return this._database.collection(collection).findOne(filter ?? {});
  }

  public async deleteMany(collection: string, filter: Filter<Document>): Promise<void> {
    await this._database.collection(collection).deleteMany(filter);
  }
}
