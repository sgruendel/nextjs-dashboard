import { Schema, model, models } from 'mongoose';

// TODO interface siehe https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/models/Pet.ts
const UsersSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    autoCreate: true,
    timestamps: true,
  }
);

const Users = models.Users || model('Users', UsersSchema);

export default Users;
