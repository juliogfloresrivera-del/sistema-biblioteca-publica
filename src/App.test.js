import { render, screen } from "@testing-library/react";
import App from "./App";

test("muestra la pantalla de acceso bibliotecario", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /bienvenido a bibliotech/i })).toBeInTheDocument();
});
