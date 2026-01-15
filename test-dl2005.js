import mongoose from 'mongoose';
import Prefield from './model/prefield.model.js';

const MONGO_URI = "mongodb+srv://digicodersdevelopment_db_user:LsgpfZhoMejwO9Qd@cluster0.le63hap.mongodb.net/vizstik_db?appName=Cluster0";

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected\n');

    const username = "DL2005";

    // Exact match
    console.log('=== Test 1: Exact match ===');
    const exact = await Prefield.find({ Section_AE: username }).limit(5);
    console.log('Found:', exact.length);
    exact.forEach((p, i) => {
      console.log(`${i + 1}. WD: ${p.WD_Code}, Section_AE: "${p.Section_AE}"`);
    });

    // Case insensitive
    console.log('\n=== Test 2: Case insensitive ===');
    const caseInsensitive = await Prefield.find({
      Section_AE: { $regex: username, $options: "i" }
    }).limit(5);
    console.log('Found:', caseInsensitive.length);
    caseInsensitive.forEach((p, i) => {
      console.log(`${i + 1}. WD: ${p.WD_Code}, Section_AE: "${p.Section_AE}"`);
    });

    // Check all DL2005 records
    console.log('\n=== Test 3: All DL2005 records ===');
    const all = await Prefield.countDocuments({
      Section_AE: { $regex: "DL2005", $options: "i" }
    });
    console.log('Total DL2005 records:', all);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
