import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Outlet from './model/outlet.model.js';

dotenv.config();

async function checkOutlets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vizstik');
    console.log('Connected to DB');

    const outlets = await Outlet.find().sort({ createdAt: -1 }).limit(5);
    console.log('Last 5 Outlets:');
    outlets.forEach(o => {
      console.log(JSON.stringify(o, null, 2));
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkOutlets();
