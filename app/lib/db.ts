import mongoose from 'mongoose';

// TODO https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/lib/dbConnect.ts

let isConnected = false;

export const connectToDb = async () => {
  if (isConnected) {
    console.log('db already connected');
    return;
  }

  try {
    //mongoose.set('strictQuery', false);
    console.log('connecting to ' + process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: 'nextjs-dashboard',
    });
    isConnected = true;
  } catch (err) {
    console.error(err);
  }
};
