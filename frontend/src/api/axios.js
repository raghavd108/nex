// src/api/axios.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Ensure cookies or auth headers work
});

export default API;
