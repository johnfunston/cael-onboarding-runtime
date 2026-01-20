import dotenv from 'dotenv'
import app from './app'
import { connectToDatabase } from './config/db'


dotenv.config()
const PORT = process.env.PORT || 4000

async function start() {
    try {
        await connectToDatabase()
        app.listen(PORT, () => {
            console.log(`Cael Runtime API listening on ${PORT}`)
        })
    } catch (err) {
        console.error('Failed to start server:', err)
        process.exit(1)
    }
}

start()