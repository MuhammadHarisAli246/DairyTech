import api from "./api";

export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        phoneNo: userData.phoneNo,
        password: userData.password,
    });

    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post("/auth/login", {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
    });

    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
    });

    return response.data;
};

export const resetPassword = async (token, password) => {
    const response = await api.post("/auth/reset-password", {
        token,
        password,
    });

    return response.data;
};