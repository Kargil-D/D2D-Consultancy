import { z } from "zod";
import { isValidPhone } from "@/utils/validators";

const TravellerTypeEnum = z.enum(["couple", "family", "friends", "solo"]);

export const EnquirySchema = z.object({
  destination: z.string().trim().min(1, "Destination is required"),
  travellerType: TravellerTypeEnum,
  travellerCount: z.number().int().positive("Traveller count must be at least 1"),
  adultsCount: z.number().int().nonnegative().optional(),
  childrenCount: z.number().int().nonnegative().optional(),
  duration: z.string().trim().min(1, "Duration is required"),
  departureCity: z.string().trim().min(1, "Departure city is required"),
  language: z.string().trim().optional(),
  departureDate: z.string().trim().min(1, "Departure date is required"),
  customerName: z.string().trim().min(2, "Enter your full name"),
  customerEmail: z.string().trim().email("Enter a valid email address"),
  customerPhone: z.string().trim().refine(isValidPhone, "Enter a valid phone number"),
});

export type EnquiryInput = z.infer<typeof EnquirySchema>;
