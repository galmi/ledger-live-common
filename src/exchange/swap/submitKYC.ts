import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import type { KYCData, SubmitKYC } from "./types";
import { ValidationError } from "../../errors";

export const submitKYC: SubmitKYC = async (provider: string, data: KYCData) => {
  try {
    const res = await network({
      method: "POST",
      url: `${getSwapAPIBaseURL()}/provider/${provider}/user`,
      data,
    });

    const { id, status } = res.data;

    return {
      id,
      status,
    };
  } catch (error) {
    // Nb this is the best we have, no _per field_ validation but rather
    // error handling at the top level.

    // TODO detect KYC specs changed to throw specific error
    return {
      error: new ValidationError(error.message),
    };
  }
};
export default submitKYC;
