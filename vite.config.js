import { defineConfig } from "vite";

// La demo se publica en https://gibson1987r.github.io/calorie-smart/ , no en la
// raíz del dominio. Sin este `base` los assets se piden a / y la página carga
// en blanco.
export default defineConfig({
  base: "/calorie-smart/",
});
