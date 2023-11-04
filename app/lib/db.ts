import mongoose from 'mongoose';


//mongoose.set('strictQuery', false);

type MongooseModuleType = typeof mongoose;
type MongooseConnectionType = {
  conn: MongooseModuleType | null;
  connPromise: Promise<MongooseModuleType> | null;
};

// see https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/lib/dbConnect.ts
declare global {
  var mongooseConnection: MongooseConnectionType; // This must be a `var` and not a `let / const`
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, connPromise: null };
}

export const connectToDb = async () => {
  console.log('connecting to ' + MONGODB_URI);
  if (cached.conn) {
    console.log('using cached connection');
    return cached.conn;
  }
  if (!cached.connPromise) {
    const opts = {
      // bufferCommands: false,
      dbName: 'nextjs-dashboard',
    };
    console.log('creating connection ...');
    cached.connPromise = mongoose.connect(MONGODB_URI, opts).then((conn) => {
      console.log('connected!');
      return conn;
    });
  }
  try {
    console.log('waiting for connection ...');
    cached.conn = await cached.connPromise;
  } catch (e) {
    console.error('error waiting for connection', e);
    cached.connPromise = null;
    throw e;
  }

  return cached.conn;
};