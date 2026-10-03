import { NextResponse } from "next/server";

import { getCart, updateCart } from "@/lib/cart";
import { MAX_LINE_QUANTITY, type CartAction, type CartResponse } from "@/lib/cart/types";

function parseAction(body: unknown): CartAction | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const quantity = Number(b.quantity);
  const validQty = Number.isInteger(quantity) && quantity >= 0 && quantity <= MAX_LINE_QUANTITY;
  if (b.type === "add" && typeof b.variantId === "string" && validQty && quantity > 0) {
    return { type: "add", variantId: b.variantId, quantity };
  }
  if (b.type === "update" && typeof b.lineId === "string" && validQty) {
    return { type: "update", lineId: b.lineId, quantity };
  }
  if (b.type === "remove" && typeof b.lineId === "string") {
    return { type: "remove", lineId: b.lineId };
  }
  return null;
}

const FAILED = "De winkelmand kon niet worden bijgewerkt. Probeer het opnieuw.";

export async function GET() {
  try {
    return NextResponse.json<CartResponse>({ cart: await getCart() });
  } catch (error) {
    console.error("[winkelmand] ophalen mislukt", error);
    return NextResponse.json({ error: "De winkelmand kon niet worden geladen." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const action = parseAction(await request.json().catch(() => null));
  if (!action) return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  try {
    const result = await updateCart(action);
    return NextResponse.json<CartResponse>(result);
  } catch (error) {
    console.error("[winkelmand] bijwerken mislukt", error);
    return NextResponse.json({ error: FAILED }, { status: 502 });
  }
}
