import api from "./api";

export const generateReceipt = async (data) => {
    const response = await api.post("/receipts/generate", data);
    return response.data;
};

export const getReceiptsByCustomer = async (customerId) => {
    const response = await api.get(`/receipts/customer/${customerId}`);
    return response.data;
};

export const generateAllReceipts = async (data) => {
  const response = await api.post("/receipts/generate-all", data);
  return response.data;
};

export const getAllReceipts = async (month = "") => {
  const url = month ? `/receipts?month=${month}` : "/receipts";
  const response = await api.get(url);
  return response.data;
};