import api from "./api";

export async function createProduct(token, product) {
  return api("/api/products", {
    method: "POST",
    token,
    body: product,
  });
}

export async function updateProduct(token, id, product) {
  return api(`/api/products/${id}`, {
    method: "PUT",
    token,
    body: product,
  });
}

export async function deleteProduct(token, id) {
  return api(`/api/products/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function getProducts(token) {
  return api("/api/products/mine", {
    token,
  });
}

export async function getProduct(token, id) {
  return api(`/api/products/${id}`, {
    token,
  });
}

export async function saveDraft(token, product) {
  return api("/api/products/draft", {
    method: "POST",
    token,
    body: {
      ...product,
      status: "draft",
    },
  });
}

export async function publishProduct(token, product) {
  return api("/api/products/publish", {
    method: "POST",
    token,
    body: {
      ...product,
      status: "published",
    },
  });
}