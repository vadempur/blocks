export const getBalanceSchema = {
    params: {
      type: "object",
      required: ["address"],
      properties: {
        address: { type: "string", minLength: 1, pattern: "^[a-zA-Z0-9]+$" }
      },
      additionalProperties: false
    }
};

  
