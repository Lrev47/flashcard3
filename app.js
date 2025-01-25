import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import routes from './src/routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/', routes);


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('views', [
    path.join(__dirname, 'src/features/flashCards/views'),
    path.join(__dirname, 'src/features/practiceTests/views'),
    path.join(__dirname, 'src/features/studyGuides/views'),
  ]);
  app.set('view engine', 'ejs');

export default app;