import 'dotenv/config';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

async function test() {
  console.log('Testing MongoDB connection (Forcing IPv4)...');
  try {
    await mongoose.connect(process.env.MONGODB_URI!, { family: 4, serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB failed:', err);
  }

  console.log('\nTesting Gemini API...');
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      contents: 'Say "AI is working!"',
    });
    console.log('✅ Gemini responded:', res.text);
  } catch (err) {
    console.error('❌ Gemini failed:', err);
  }
  
  process.exit(0);
}

test();
