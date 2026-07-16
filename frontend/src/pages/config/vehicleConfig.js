// config/vehicleConfig.js
export const vehicleConfig = {
    "Tw": {
      OD_Brokerage_Rate: 5,
      TP_Terrorism_Brokerage_Rate: 2,
      classifications: ["Bike", "Scooter"],
      productTypes: [
        "Liability - Motor TP Only",
        "Liability - Motor TP Only 2 Year",
        "Liability - Motor TP Only 3 Year",
        "Liability - Motor TP 0+5",
        "Package - Motor OD only",
        "Package",
        "Package 1+5",
        "Nil Dep - Motor OD only",
        "Nil Dep",
        "Nil Dep 1+5"
      ],
      showSeat: false
    },
    "Commercial Tw": {
      OD_Brokerage_Rate: 5,
      TP_Terrorism_Brokerage_Rate: 2,
      classifications: ["Bike", "Scooter"],
      productTypes: [
        "Liability - Motor TP Only",
        "Liability - Motor TP Only 2 Year",
        "Liability - Motor TP Only 3 Year",
        "Liability - Motor TP 0+5",
        "Package - Motor OD only",
        "Package",
        "Package 1+5",
        "Nil Dep - Motor OD only",
        "Nil Dep",
        "Nil Dep 1+5"
      ],
      showSeat: false
    },
    "Pvt Car": {
      OD_Brokerage_Rate: 6,
      TP_Terrorism_Brokerage_Rate: 3,
      classifications: ["Pvt Car"],
      productTypes: [
        "Liability - Motor TP Only",
        "Liability - Motor TP 0+3",
        "Package - Motor OD only",
        "Package",
        "Package 1+3",
        "Nil Dep - Motor OD only",
        "Nil Dep",
        "Nil Dep 1+3"
      ],
      showSeat: true
    },
    "Commercial Vehicle": {
      OD_Brokerage_Rate: 8,
      TP_Terrorism_Brokerage_Rate: 4,
      classifications: [
        "Taxi upto 6 pass","Taxi More than 6 pass",
        "Three Wheeler - GCV - Public","Three Wheeler - GCV - Private",
        "Three Wheeler - PCV - UPTO 6 PASS","Three Wheeler - PCV - MORE THAN 6 PASS",
        "GCV-Public(upto-2.5T)","GCV-Public(2.5T>=3.5T)","GCV-Public(3.5T>=7.5T)",
        "GCV-Public(7.5T-17T)","GCV-Public(17T-26T)","GCV-Public(26T-40T)",
        "GCV-Public(Above-40T)","GCV-Private(upto-2.5T)","GCV-Private(2.5T>=3.5T)",
        "GCV-Private(3.5T>=7.5T)","GCV-Private(7.5T-17T)","GCV-Private(17T-26T)",
        "GCV-Private(26T-40T)","GCV-Private(Above-40T)","PCV-Route Bus",
        "PCV-Staff Bus","PCV-School Bus","Other"
      ],
      productTypes: ["Liability - Motor TP Only", "Package", "Nil Dep"],
      showSeat: true
    },
    "Misc-D": {
      OD_Brokerage_Rate: 7,
      TP_Terrorism_Brokerage_Rate: 3,
      classifications: [
        "Motor Trade Policy","Agri Tractor","Commercial Tractor",
        "Misc and SP type of Vehicle","Ambulance","Other"
      ],
      productTypes: ["Liability - Motor TP Only", "Package", "Nil Dep"],
      showSeat: true
    }
  };