/**
 * GraphQL-documenten voor de Storefront API.
 *
 * Alle operaties gebruiken @inContext zodat prijzen in euro's en teksten in
 * het Nederlands terugkomen (land/taal uit de omgeving).
 */

const CONTEXT_VARS = "$country: CountryCode, $language: LanguageCode";
const IN_CONTEXT = "@inContext(country: $country, language: $language)";

/** Metafields in namespace "casezo" die de winkel leest (zie README). */
export const PRODUCT_METAFIELDS = [
  "category",
  "compatibility",
  "device",
  "material",
  "magsafe",
  "specs",
  "highlights",
  "featured",
] as const;

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    vendor
    productType
    description
    tags
    createdAt
    publishedAt
    images(first: 20) {
      nodes { url altText width height }
    }
    options(first: 5) {
      name
      optionValues { name swatch { color } }
    }
    variants(first: 100) {
      nodes {
        id
        sku
        title
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        selectedOptions { name value }
        image { url }
        device: metafield(namespace: "casezo", key: "device") { value }
      }
    }
    collections(first: 10) {
      nodes { handle }
    }
    metafields(identifiers: [
      ${PRODUCT_METAFIELDS.map((key) => `{ namespace: "casezo", key: "${key}" }`).join("\n      ")}
    ]) {
      key
      value
    }
  }
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  query CasezoProducts($first: Int!, $after: String, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    products(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes { ...ProductFields }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const SEARCH_QUERY = /* GraphQL */ `
  query CasezoSearch($query: String!, $first: Int!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    search(query: $query, first: $first, types: [PRODUCT], unavailableProducts: LAST) {
      nodes {
        ... on Product { handle }
      }
    }
  }
`;

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          amountPerQuantity { amount currencyCode }
          totalAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            selectedOptions { name value }
            image { url altText width height }
            product {
              handle
              title
              vendor
              featuredImage { url altText width height }
            }
          }
        }
      }
    }
  }
`;

export const CART_QUERY = /* GraphQL */ `
  query CasezoCart($cartId: ID!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cart(id: $cartId) { ...CartFields }
  }
  ${CART_FIELDS}
`;

export const CART_CREATE = /* GraphQL */ `
  mutation CasezoCartCreate($lines: [CartLineInput!], ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_ADD = /* GraphQL */ `
  mutation CasezoCartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CasezoCartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FIELDS}
`;

export const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CasezoCartLinesRemove($cartId: ID!, $lineIds: [ID!]!, ${CONTEXT_VARS}) ${IN_CONTEXT} {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FIELDS}
`;
