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
  (error) => {
    const requestUrl = String(error.config?.url || '').split('?')[0];
    const isLoginRequest = requestUrl.endsWith('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.assign(LOGIN_URL);
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
    }

    // Append the parsed form data as JSON string
    data.append('policyData', JSON.stringify(formDataObject));

    const response = await axiosInstance.post('/policies', data);
    return response.data;
  } catch (error) {
    console.error('Policy Submission Error:', error);
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
