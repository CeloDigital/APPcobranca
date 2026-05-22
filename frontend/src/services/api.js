// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001' // O endereço onde o seu Node.js está rodando
});

export default api;