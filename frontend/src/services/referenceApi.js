import axiosInstance from '../config/axios';

export const referenceApi = {
  getAll: async () => {
    const response = await axiosInstance.get('/references');
    const data = response.data?.data ?? response.data;
    if (!Array.isArray(data)) {
      throw new Error(response.data?.message || 'Invalid references response');
    }
    return data;
  },
  create: async (payload) => {
    const response = await axiosInstance.post('/references', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await axiosInstance.put(`/references/${id}`, payload);
    return response.data;
  },
};
