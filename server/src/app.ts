import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import revRouter from './routes/rev.routes';

dotenv.config()

const app = express();

app.use(cors())
app.use(express.json())

// Temporary healthcheck route
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'cael-runtime-api' })
})
app.use('/mesh', revRouter)

//routes

export default app