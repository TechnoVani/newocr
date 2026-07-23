import vision from "@google-cloud/vision";
import Tesseract from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import OCR_CONFIG from "../../config/ocr.config.js";

class OCRService {
    constructor() {
        this.provider = OCR_CONFIG.provider || "tesseract";
        
        // Initialize Google Vision client if configured
        if (this.provider === "google") {
            try {
                this.client = new vision.ImageAnnotatorClient();
            } catch (err) {
                console.error("Failed to initialize Google Vision Client. Check credentials.", err.message);
            }
        }

        // Initialize Gemini model if configured
        if (this.provider === "gemini") {
            try {
                const apiKey = OCR_CONFIG.gemini.apiKey || process.env.GEMINI_API_KEY;
                if (apiKey) {
                    this.genAI = new GoogleGenerativeAI(apiKey);
                    this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                } else {
                    console.error("Gemini API Key is missing in configuration.");
                }
            } catch (err) {
                console.error("Failed to initialize Gemini Client.", err.message);
            }
        }
    }

    /**
     * Extracts raw text from a document/image file
     * @param {string} filePath 
     * @returns {Promise<string>} Raw text content
     */
    async extractText(filePath) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            let text = "";

            if (ext === ".pdf") {
                if (this.provider === "gemini") {
                    if (!this.geminiModel) {
                        throw new Error("Gemini AI client is not initialized. Check GEMINI_API_KEY.");
                    }
                    const pdfBuffer = await fs.readFile(filePath);
                    const filePart = {
                        inlineData: {
                            data: pdfBuffer.toString("base64"),
                            mimeType: "application/pdf"
                        }
                    };
                    const prompt = "Extract all text from this insurance policy PDF. Retrieve all fields, policy numbers, customer names, engine and chassis details, dates, and amounts clearly.";
                    const result = await this.geminiModel.generateContent([prompt, filePart]);
                    text = result.response.text();
                } else {
                    // Fallback to pdf-parse for text extraction for Tesseract/Google Vision
                    const pdfBuffer = await fs.readFile(filePath);
                    const parsedPdf = await pdfParse(pdfBuffer);
                    text = parsedPdf.text || "";
                    
                    if (text.trim().length < 50) {
                        text = `${text}\n\n[Warning: Minimal text extracted from PDF. If this is a scanned PDF, please use the Gemini OCR provider for optical character recognition support.]`;
                    }
                }
            } else {
                // Image file (PNG, JPG, JPEG)
                if (this.provider === "google") {
                    if (!this.client) {
                        throw new Error("Google Vision client is not initialized.");
                    }
                    const [result] = await this.client.textDetection(filePath);
                    const detections = result.textAnnotations;
                    if (detections && detections.length > 0) {
                        text = detections[0].description;
                    }
                } else if (this.provider === "tesseract") {
                    const result = await Tesseract.recognize(filePath, "eng");
                    text = result.data.text;
                } else if (this.provider === "gemini") {
                    if (!this.geminiModel) {
                        throw new Error("Gemini AI client is not initialized.");
                    }
                    const imgBuffer = await fs.readFile(filePath);
                    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
                    const filePart = {
                        inlineData: {
                            data: imgBuffer.toString("base64"),
                            mimeType: mimeType
                        }
                    };
                    const prompt = "Extract all text from this image exactly. Do not add any extra conversational text.";
                    const result = await this.geminiModel.generateContent([prompt, filePart]);
                    text = result.response.text();
                } else {
                    throw new Error(`Unsupported OCR provider: ${this.provider}`);
                }
            }

            return text;
        } catch (error) {
            console.error("Error in extractText service:", error);
            throw error;
        }
    }

    /**
     * Parses key insurance details from raw text using regex matching
     * @param {string} text 
     * @returns {object} Extracted field keys and values
     */
    extractPolicyDataRegex(text) {
        const data = {};
        
        // Define robust patterns for regex matching
        const patterns = {
            policy_number: /(?:Policy\s*(?:No|Number)|Policy\s*#)[:\s]*([A-Z0-9\-\/\\_]+)/i,
            insurance_company: /(?:Insurance\s*Company|Insurer)[:\s]*([A-Za-z0-9\s,\.]+)/i,
            insured_name: /(?:Insured\s*(?:Name|Customer)|Insured\s*Details)[:\s]*([A-Za-z\s\.\-\(\)]+)/i,
            pan: /(?:PAN\s*Card|PAN|Permanent\s*Account\s*Number)[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
            gstin: /(?:GSTIN|GST\s*Number|GST\s*Reg\s*No)[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i,
            contact: /(?:Contact|Mobile|Phone|Tel)[:\s]*([0-9]{10,12})/i,
            email: /(?:Email|E-mail)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            registration_number: /(?:Registration\s*(?:No|Number)|Reg\s*No)[:\s]*([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})/i,
            engine_number: /(?:Engine\s*(?:No|Number))[:\s]*([A-Z0-9]+)/i,
            chassis_number: /(?:Chassis\s*(?:No|Number))[:\s]*([A-Z0-9]+)/i,
            net_premium: /(?:Net\s*Premium)[:\s]*(?:Rs\.?|INR)?\s*([0-9,.]+)/i,
            gst: /(?:GST|Service\s*Tax)[:\s]*(?:Rs\.?|INR)?\s*([0-9,.]+)/i,
            total_payable: /(?:Total\s*(?:Payable|Premium|Amount))[:\s]*(?:Rs\.?|INR)?\s*([0-9,.]+)/i,
            idv: /(?:IDV|Insured\s*Declared\s*Value)[:\s]*(?:Rs\.?|INR)?\s*([0-9,.]+)/i,
            make_name: /(?:Make|Manufacturer)[:\s]*([A-Za-z0-9\s]+)/i,
            model_name: /(?:Model|Vehicle\s*Model)[:\s]*([A-Za-z0-9\s\-]+)/i,
            manufacturing_year: /(?:Manufacturing\s*Year|Year\s*of\s*Make)[:\s]*([0-9]{4})/i,
            previous_insurer: /(?:Previous\s*Insurer|Prev\s*Insurer)[:\s]*([A-Za-z0-9\s,\.]+)/i,
            previous_policy: /(?:Previous\s*Policy\s*(?:No|Number))[:\s]*([A-Z0-9\-\/]+)/i
        };

        Object.keys(patterns).forEach(field => {
            const match = text.match(patterns[field]);
            if (match && match[1]) {
                data[field] = match[1].trim();
            } else {
                data[field] = "";
            }
        });

        // Clean currency formats (remove commas)
        const numericFields = ["net_premium", "gst", "total_payable", "idv"];
        numericFields.forEach(field => {
            if (data[field]) {
                data[field] = parseFloat(data[field].replace(/,/g, "")) || 0;
            } else {
                data[field] = 0;
            }
        });

        if (data.manufacturing_year) {
            data.manufacturing_year = parseInt(data.manufacturing_year) || null;
        }

        return data;
    }

    /**
     * Extracts structured policy details from raw text or directly via Gemini LLM
     * @param {string} text - Raw OCR text
     * @param {string} [filePath] - Optional original file path if Gemini is the provider
     * @returns {Promise<object>} Parsed key-value pairs of the policy
     */
    async extractPolicyData(text, filePath = null) {
        if (this.provider === "gemini" && filePath && this.geminiModel) {
            try {
                // If Gemini, we can do a structured parsing call using the raw PDF/image or text
                const ext = path.extname(filePath).toLowerCase();
                const mimeType = ext === ".pdf" ? "application/pdf" : (ext === ".png" ? "image/png" : "image/jpeg");
                const fileBuffer = await fs.readFile(filePath);
                
                const filePart = {
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType
                    }
                };

                const prompt = `
                Analyze this insurance policy document and extract the information. 
                Return a raw JSON object containing the following keys and map them strictly to the values in the document.
                If a key is not found, leave the value as an empty string. 
                Ensure dates are strictly in YYYY-MM-DD format, numbers are floats or integers, and do not include any currency symbols or commas.
                
                Keys to extract:
                - bqp_id
                - reporting_id
                - rm_id
                - pos_id
                - ref_id
                - business_type (e.g., New, Roll-over, Renewal)
                - insurance_company
                - policy_number
                - policy_type (e.g., Package Policy, Standalone OD, Liability Policy)
                - vehicle_category (e.g., Two Wheeler, Private Car, Commercial)
                - office_name
                - insured_name
                - pan
                - gstin
                - contact
                - email
                - address
                - start_date (YYYY-MM-DD)
                - od_expiry (YYYY-MM-DD)
                - tp_expiry (YYYY-MM-DD)
                - issue_date (YYYY-MM-DD)
                - idv (Number)
                - previous_insurer
                - previous_policy
                - first_year_od (Number)
                - first_year_tp (Number)
                - total_od (Number)
                - total_tp (Number)
                - net_premium (Number)
                - gst (Number)
                - total_payable (Number)
                - registration_number
                - manufacturing_year (Integer)
                - commercial_vehicle_type
                - chassis_number
                - sub_type
                - engine_number
                - fuel (e.g., Petrol, Diesel, CNG)
                - gvw
                - make_name
                - cc
                - model_name
                - seating_capacity (Text; preserve the original format, for example "1+4")
                - variant_name
                - financier
                - irda_od
                - irda_tp
                - irda_net
                - pos_od
                - pos_tp
                - pos_net
                - verify_remark
                - account_remark
                - payment_status

                Respond with ONLY valid JSON. Do not include markdown code block syntax (like \`\`\`json).
                `;

                const result = await this.geminiModel.generateContent([prompt, filePart]);
                let responseText = result.response.text().trim();
                
                // Clean markdown code blocks if the model included them
                if (responseText.startsWith("```")) {
                    responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
                }

                return JSON.parse(responseText);
            } catch (err) {
                console.error("Gemini failed to extract JSON, falling back to regex:", err);
                return this.extractPolicyDataRegex(text);
            }
        }

        // Fallback for Vision/Tesseract
        return this.extractPolicyDataRegex(text);
    }

    /**
     * Complete process combining OCR extraction and parsing
     * @param {string} filePath 
     * @returns {Promise<object>} Combined text and structured data
     */
    async process(filePath) {
        const text = await this.extractText(filePath);
        const policyData = await this.extractPolicyData(text, filePath);
        
        return {
            text,
            policyData
        };
    }
}

export default new OCRService();
