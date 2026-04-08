const EDAMAM_URL = "https://api.edamam.com/api/nutrition-data";
const NUTRITIONIX_URL = "https://trackapi.nutritionix.com/v2/natural/nutrients";

export async function consultarCaloriasEdamam(query) {
  const params = new URLSearchParams({
    app_id: import.meta.env.VITE_EDAMAM_APP_ID,
    app_key: import.meta.env.VITE_EDAMAM_APP_KEY,
    ingr: query,
  });

  const response = await fetch(`${EDAMAM_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("No se pudo consultar Edamam");
  }

  const data = await response.json();
  return {
    nombre: query,
    calorias: Math.round(data.calories || 0),
    fuente: "Edamam",
  };
}

export async function consultarCaloriasNutritionix(query) {
  const response = await fetch(NUTRITIONIX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-id": import.meta.env.VITE_NUTRITIONIX_APP_ID,
      "x-app-key": import.meta.env.VITE_NUTRITIONIX_APP_KEY,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("No se pudo consultar Nutritionix");
  }

  const data = await response.json();
  const total = (data.foods || []).reduce(
    (sum, item) => sum + Math.round(item.nf_calories || 0),
    0
  );

  return {
    nombre: query,
    calorias: total,
    fuente: "Nutritionix",
  };
}
