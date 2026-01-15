import mongoose from 'mongoose';
import Employee from './model/employee.model.js';
import Prefield from './model/prefield.model.js';

const MONGO_URI = "mongodb+srv://digicodersdevelopment_db_user:LsgpfZhoMejwO9Qd@cluster0.le63hap.mongodb.net/vizstik_db?appName=Cluster0";

async function testSectionAE() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const username = "DL2005";

    // Test 1: Check employees
    console.log('=== Employees with Section_AE = DL2005 ===');
    const employees = await Employee.find({
      Section_AE: { $regex: username, $options: "i" }
    }).select('dsName Section_AE').limit(5);

    console.log('Total:', employees.length);
    employees.forEach((emp, i) => {
      console.log(`${i + 1}. ${emp.dsName} - Section_AE: "${emp.Section_AE}"`);
    });

    // Test 2: Check prefields
    console.log('\n=== Prefields with Section_AE = DL2005 ===');
    const prefields = await Prefield.find({
      Section_AE: { $regex: username, $options: "i" }
    }).select('WD_Code Section_AE').limit(5);

    console.log('Total:', prefields.length);
    prefields.forEach((pf, i) => {
      console.log(`${i + 1}. WD: ${pf.WD_Code} - Section_AE: "${pf.Section_AE}"`);
    });

    // Test 3: Sample Section_AE values
    console.log('\n=== Sample Section_AE values ===');
    const sample = await Employee.find({ Section_AE: { $ne: null } })
      .select('Section_AE').limit(10);
    const values = [...new Set(sample.map(e => e.Section_AE))];
    console.log(values);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testSectionAE();
