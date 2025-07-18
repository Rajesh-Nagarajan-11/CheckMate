const axios = require('axios');
const baseURL = process.env.FASTAPI_BASE_URL;

exports.getPredictedTime = async (data) => {
  const res = await axios.post(`${baseURL}/predictTaskTime`, data);
  return res.data;
};

exports.getPredictedSpeed = async (data) => {
  const res = await axios.post(`${baseURL}/predictSpeed`, data);
  return res.data;
};

exports.getEngineFault = async (data) => {
  // Ensure data is always an object with temperature and humidity
  const payload = {
    temperature: data?.temperature ?? 0,
    humidity: data?.humidity ?? 0
  };
  const res = await axios.post(`${baseURL}/predictFault`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};
