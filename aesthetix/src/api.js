import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8091/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

export const createUser = async (userData) => {
  return api.post("/users", userData);


};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post("http://localhost:8091/api/users/login", { email, password });

    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data)); // Store entire user object
      return response.data;
    }
  } catch (error) {
    console.error("Login failed:", error);
    return null;
  }
};


export default api;
