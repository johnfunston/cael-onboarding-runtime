import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || ''

export async function connectToDatabase() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not set in environment variables')
    }

    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
}