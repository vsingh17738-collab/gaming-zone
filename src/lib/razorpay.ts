import "server-only";

import Razorpay from "razorpay";
import { ConfigurationError } from "./errors";

export function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    throw new ConfigurationError("Razorpay");
  }
  return new Razorpay({ key_id, key_secret });
}
