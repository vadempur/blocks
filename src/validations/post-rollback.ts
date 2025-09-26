export const postRollbackSchema = {
    type: "object",
    required: ["height"],
    properties: {
      height: { type: "integer", minimum: 0 }
    },
    additionalProperties: false
  };