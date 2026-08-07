import api from "./api";

export const getTodayMilk = async () => {
  const response = await api.get("/milk/today");
  return response.data;
};

export const getAllMilk = async (date = "") => {
  const url = date ? `/milk?date=${date}` : "/milk";
  const response = await api.get(url);
  return response.data;
};

export const getMilkByCustomer = async (customerId) => {
  const response = await api.get(`/milk/customer/${customerId}`);
  return response.data;
};

export const updateMorningMilk = async (id, data) => {
  const response = await api.patch(`/milk/${id}/morning`, data);
  return response.data;
};

export const updateEveningMilk = async (id, data) => {
  const response = await api.patch(`/milk/${id}/evening`, data);
  return response.data;
};

export const deleteMilk = async (id) => {
  const response = await api.delete(`/milk/${id}`);
  return response.data;
};