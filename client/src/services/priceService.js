import api from "./api";

export const getLatestPrice = async () => {
    const response = await api.get("/price");
    return response.data;
};

export const setPrice = async (data) => {
    const response = await api.post("/price", data);
    return response.data;
};
