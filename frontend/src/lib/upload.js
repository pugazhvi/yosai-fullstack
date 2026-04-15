import api from "./api";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export async function uploadToCloudinary(file, folder = "yosai") {
  const base64 = await fileToBase64(file);
  const res = await api.post("/upload", { file: base64, folder });
  return res.data?.url || res.url;
}

export async function uploadMultiple(files, folder = "yosai") {
  return Promise.all(files.map((f) => uploadToCloudinary(f, folder)));
}
