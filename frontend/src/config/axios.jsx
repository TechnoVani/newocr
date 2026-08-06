import axios from 'axios';
import { API_BASE_URL, LOGIN_URL } from './env';

/**
 * Centralized Axios Configuration
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Request Interceptor
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const requestUrl = String(config.url || "");
    if (
      requestUrl.startsWith("/") &&
      !requestUrl.startsWith("/auth/") &&
      !requestUrl.startsWith("/setcomm") &&
      !requestUrl.startsWith("/operations/") &&
      !requestUrl.startsWith("/accounts/") &&
      !requestUrl.startsWith("/pos-management/") &&
      !requestUrl.startsWith("/departments/")
    ) {
      const isPosManagementPage = window.location.pathname.startsWith('/pos-management');
      config.url = `${isPosManagementPage ? '/pos-management' : '/operations'}${requestUrl}`;
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only set Content-Type to JSON if the data is NOT FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    config.headers.Accept = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = error.config;
    const method = String(requestConfig?.method || "get").toLowerCase();
    const serviceRetries = Number(requestConfig?.serviceRetries || 0);
    if (
      error.response?.status === 503 &&
      ["get", "head"].includes(method) &&
      serviceRetries < 2
    ) {
      requestConfig.serviceRetries = serviceRetries + 1;
      const retryAfterSeconds = Number(error.response.headers?.["retry-after"]);
      const delay = Number.isFinite(retryAfterSeconds)
        ? Math.min(retryAfterSeconds * 1000, 5000)
        : 500 * requestConfig.serviceRetries;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance(requestConfig);
    }

    const requestUrl = String(error.config?.url || '').split('?')[0];
    const isLoginRequest = requestUrl.endsWith('/auth/login');

    const isAuthCheckRequest = requestUrl.endsWith('/auth/me');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (!isAuthCheckRequest) {
        window.location.assign(LOGIN_URL);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to update headers globally (e.g., after login/logout)
 */
export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

/**
 * Utility function: Submit Policy Data with Files
 */
export const submitPolicyData = async (file, formDataObject) => {
  try {
    const data = new FormData();

    // Append the main PDF file
    if (file) {
      data.append('pdfFile', file);
    }

    // Append KYC files if present
    if (formDataObject?.vehicle) {
      if (formDataObject.vehicle.aadhaarFront instanceof File) {
        data.append('aadhaar_front', formDataObject.vehicle.aadhaarFront);
      }
      if (formDataObject.vehicle.aadhaarBack instanceof File) {
        data.append('aadhaar_back', formDataObject.vehicle.aadhaarBack);
      }
      if (formDataObject.vehicle.panCard instanceof File) {
        data.append('pan', formDataObject.vehicle.panCard);
      }
      if (formDataObject.vehicle.rcFrontDocument instanceof File) {
        data.append('rc_front', formDataObject.vehicle.rcFrontDocument);
      }
      if (formDataObject.vehicle.rcBackDocument instanceof File) {
        data.append('rc_back', formDataObject.vehicle.rcBackDocument);
      }
      if (
        !(formDataObject.vehicle.rcFrontDocument instanceof File) &&
        !(formDataObject.vehicle.rcBackDocument instanceof File) &&
        formDataObject.vehicle.rcDocument instanceof File
      ) {
        data.append('rc', formDataObject.vehicle.rcDocument);
      }
      if (formDataObject.vehicle.previousPolicyDocument instanceof File) {
        data.append('previous_policy', formDataObject.vehicle.previousPolicyDocument);
      }
      if (formDataObject.vehicle.invoiceDocument instanceof File) {
        data.append('invoice', formDataObject.vehicle.invoiceDocument);
      }
      if (formDataObject.vehicle.surveyReport instanceof File) {
        data.append('survey_report', formDataObject.vehicle.surveyReport);
      }
      if (formDataObject.vehicle.gstCertificate instanceof File) {
        data.append('gst_certificate', formDataObject.vehicle.gstCertificate);
      }
    }

    // Append the parsed form data as JSON string
    data.append('policyData', JSON.stringify(formDataObject));

    const response = await axiosInstance.post('/policies', data);
    return response.data;
  } catch (error) {
    error.userMessage =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the policy server. Check the API environment configuration and backend status.'
        : error.message);
    console.error('Policy Submission Error:', {
      status: error.response?.status,
      message: error.userMessage,
      response: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const checkPolicyNumberExists = async (policyNumber, options = {}) => {
  try {
    const response = await axiosInstance.get('/policies/exists', {
      params: { policyNumber },
      signal: options.signal,
    });
    return response.data;
  } catch (error) {
    if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
      console.error('Policy Number Check Error:', error);
    }
    throw error;
  }
};

/**
 * Utility function: Get all data with pagination
 */
export const fetchAllData = async (endpoint, params = {}) => {
  try {
    const response = await axiosInstance.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`Fetch Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Utility function: Get single item by ID
 */
export const fetchById = async (endpoint, id) => {
  try {
    const response = await axiosInstance.get(`${endpoint}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Fetch Error (${endpoint}/${id}):`, error);
    throw error;
  }
};

/**
 * Utility function: Create new item
 */
export const createData = async (endpoint, data) => {
  try {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Create Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Utility function: Update item
 */
export const updateData = async (endpoint, id, data) => {
  try {
    const response = await axiosInstance.put(`${endpoint}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Update Error (${endpoint}/${id}):`, error);
    throw error;
  }
};

/**
 * Utility function: Delete item
 */
export const deleteData = async (endpoint, id) => {
  try {
    const response = await axiosInstance.delete(`${endpoint}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Delete Error (${endpoint}/${id}):`, error);
    throw error;
  }
};

/**
 * Utility function: Upload files
 */
export const uploadFiles = async (endpoint, formData) => {
  try {
    const response = await axiosInstance.post(endpoint, formData);
    return response.data;
  } catch (error) {
    console.error(`Upload Error (${endpoint}):`, error);
    throw error;
  }
};

export default axiosInstance;
