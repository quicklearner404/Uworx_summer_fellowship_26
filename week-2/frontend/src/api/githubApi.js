import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000",
});

export async function analyzeRepository(repository) {
    const response = await API.post("/analyze", {
        repository,
    });

    return response.data;
}