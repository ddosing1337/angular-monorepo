import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './graphql/schema';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.all('/graphql', createHandler({ schema }));

app.listen(port, () => {
  console.log(`Server ready at http://localhost:${port}/graphql`);
});
