export const postBlockSchema = {
    type: "object",
    required: ["height", "id", "transactions"],
    properties: {
      height: { type: "integer", minimum: 1 },
      id: { type: "string", minLength: 64, maxLength: 64 },
      transactions: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "inputs", "outputs"],
          properties: {
            id: { type: "string" },
            inputs: {
              type: "array",
              items: {
                type: "object",
                required: ["txId", "index"],
                properties: {
                  txId: { type: "string" },
                  index: { type: "integer", minimum: 0 }
                },
                additionalProperties: false
              }
            },
            outputs: {
              type: "array",
              items: {
                type: "object",
                required: ["address", "value"],
                properties: {
                  address: { type: "string", minLength: 1 },
                  value: { type: "integer", minimum: 0 }
                },
                additionalProperties: false
              }
            }
          },
          additionalProperties: false
        }
      }
    },
    additionalProperties: false
};
  