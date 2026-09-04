import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cart-store";
import { useStockStore } from "./stock-store";

describe("Realtime Stock Stores", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useStockStore.setState({ stocks: {}, stockAlert: null });
  });

  it("syncProductStock ajusta la cantidad en el carrito si el stock disponible disminuye", () => {
    // Agregar un producto con stock 5 y cantidad 3
    useCartStore.getState().addItem({
      productoId: "prod-1",
      slug: "taza-cafe",
      nombre: "Taza Café",
      imagenUrl: null,
      precioBase: 15000,
      esPersonalizable: false,
      personalizado: false,
      stockDisponible: 5,
      cantidad: 3,
    });

    expect(useCartStore.getState().items[0].cantidad).toBe(3);

    // Supongamos que otro usuario compró 4 y ahora el stock es 1
    useCartStore.getState().syncProductStock("prod-1", 1);

    expect(useCartStore.getState().items[0].stockDisponible).toBe(1);
    expect(useCartStore.getState().items[0].cantidad).toBe(1);

    // Si se agota a 0
    useCartStore.getState().syncProductStock("prod-1", 0);
    expect(useCartStore.getState().items[0].stockDisponible).toBe(0);
    expect(useCartStore.getState().items[0].cantidad).toBe(0);
  });

  it("useStockStore actualiza los stocks reactivamente", () => {
    useStockStore.getState().setStock("prod-2", 4);
    expect(useStockStore.getState().stocks["prod-2"]).toBe(4);

    useStockStore.getState().setStock("prod-2", 0);
    expect(useStockStore.getState().stocks["prod-2"]).toBe(0);
  });
});
