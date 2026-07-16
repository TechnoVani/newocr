import React, { createContext, useState, useContext } from "react";
import axiosInstance from "../config/axios";

// Create the context
const DataContext = createContext();

// Create the provider
export const DataProvider = ({ children }) => {
  const [responseMessage, setResponseMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mandates, setMandates] = useState([]);

  /**
   * Function to send mail via API
   * @param {Object} mailData
   */
  const sendMail = async (mailData) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/contact/mail", mailData);
      setResponseMessage(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "An error occurred";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Function to submit a mandate via API
   * @param {FormData} mandateData
   */
  const submitMandate = async (mandateData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post("/mandates", mandateData);
      setResponseMessage(response.data);
      return null;
    } catch (err) {
      const status = err.response?.status;
      const errorMessages = err.response?.data?.errors || "An error occurred while submitting the mandate";

      // Handle validation errors
      if (status === 422 && typeof errorMessages === "object") {
        const errors = [];
        for (let field in errorMessages) {
          const fieldErrors = errorMessages[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((msg) => errors.push(msg));
          } else {
            errors.push(String(fieldErrors));
          }
        }
        setError(errors.join(" "));
        return errors;
      }

      // Handle other server errors
      setError(errorMessages);
      return Array.isArray(errorMessages) ? errorMessages : [errorMessages];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch mandates from API
   */
  const fetchMandates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/mandates/getalldata");
      setMandates(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "An error occurred while fetching mandates";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send email for a mandate
   * @param {string} id - Mandate ID
   */
  const handleSendEmail = async (id) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/mandates/send/${id}`);
      setError(null);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "An error occurred while sending email";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a mandate
   * @param {string} id - Mandate ID
   */
  const deleteMandate = async (id) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/mandates/${id}`);
      setMandates((prevMandates) => prevMandates.filter((mandate) => mandate.id !== id));
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "An error occurred while deleting the mandate";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        handleSendEmail,
        sendMail,
        mandates,
        submitMandate,
        deleteMandate,
        fetchMandates,
        responseMessage,
        loading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the DataContext
export const useDataContext = () => {
  return useContext(DataContext);
};

export default DataContext;
