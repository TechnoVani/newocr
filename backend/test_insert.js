import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/database.js";
import PolicyService from "./services/policy.service.js";

const testPolicyData = {
  bqp_id: "BR00000324",
  reporting_id: "",
  rm_id: "",
  pos_id: "",
  ref_id: "",
  business_type: "New", 
  insurance_company: "THE NEW INDIA ASSURANCE CO. LTD.",
  policy_number: "45071131260900002925",
  policy_type: "Two Wheeler Enhancement Cover Policy",
  vehicle_category: "Two Wheeler",
  office_name: "BO450711_DEWAS BUSINESS OFFICE (450711), 2ND FLOOR, CHAMUNDA COMPLEX, A.B. ROAD, DEWAS, MADHYA PRADESH, 455001",
  insured_name: "ARISH KHAN",
  pan: "NA",
  gstin: "NA",
  contact: "XXXXXX6406",
  email: "Shiv.gupta19sg@gmail.com",
  address: "S/O SAPHRAJ KHAN, GRAM AKAURI POST BELAHA TEHSIL SIHAWAR, SIDDI, MADHYA PRADESH, 486661",
  start_date: "2026-05-11",
  od_expiry: "2027-05-10",
  tp_expiry: "2031-05-10",
  issue_date: "2026-05-11",
  idv: 126001.00,
  previous_insurer: "Not applicable",
  previous_policy: "NA",
  first_year_od: 1039.00,
  first_year_tp: 1748.00,
  total_od: 1039.00,
  total_tp: 7640.00,
  net_premium: 8679.00,
  gst: 1562.00,
  total_payable: 10241.00,
  registration_number: "New Vehicle",
  manufacturing_year: 2026,
  commercial_vehicle_type: "",
  chassis_number: "MD2A92DX1SCJ60204",
  body_type: "Metal",
  sub_type: "DUAL CHANNEL ABS",
  engine_number: "JEX CSJ26916",
  fuel: "Petrol",
  gvw: "",
  make_name: "BAJAJ",
  cc: "160cc",
  model_name: "PULSAR NS160",
  seating_capacity: 2,
  variant_name: "DUAL CHANNEL ABS",
  financier: "BAJAJ AUTO CREDIT LIMITED",
  irda_od: "1039",
  irda_tp: "1748",
  irda_net: "8679",
  verify_remark: "WARRANTED THAT IN CASE OF DISHONOUR OF THE PREMIUM CHEQUE, THIS DOCUMENT STANDS AUTOMATICALLY CANCELLED ABINITIO",
  payment_status: "Paid",
  ocr_text: "THE NEW INDIA ASSURANCE CO. LTD. POLICY SCHEDULE CUM CERTIFICATE OF INSURANCE Policy Number: 45071131260900002925"
};

const insertData = async () => {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("Inserting test policy...");
        const result = await PolicyService.createPolicy(testPolicyData);
        
        console.log("\nSuccess! Policy has been inserted into database.");
        console.log("Generated Folder:", result.folderPath);
        console.log("Inserted ID:", result.id);
        
        process.exit(0);
    } catch (err) {
        console.error("\nInsertion failed:", err.message);
        process.exit(1);
    }
};

insertData();
