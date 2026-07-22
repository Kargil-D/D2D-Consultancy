"use client";

import { useState } from "react";
import { CheckCircle2, Users } from "lucide-react";
import { formatINR } from "@/utils/format";

interface PriceBreakdownCardProps {
  packageCostPerPerson: number;
  platformFee: number;
  insurancePerPerson: number;
  gstPercent: number;
  hasPricingBreakdown: boolean;
  price: number;
}

/**
 * Package Cost and Insurance are quoted per person and scale with the
 * traveler count entered here; Planning Platform fee is a flat one-time
 * service fee and does not scale. GST always applies as a % on the
 * resulting subtotal.
 */
export default function PriceBreakdownCard({
  packageCostPerPerson,
  platformFee,
  insurancePerPerson,
  gstPercent,
  hasPricingBreakdown,
  price,
}: PriceBreakdownCardProps) {
  const [persons, setPersons] = useState(1);

  const packageCostTotal = packageCostPerPerson * persons;
  const insuranceTotal = insurancePerPerson * persons;
  const subtotal = packageCostTotal + platformFee + insuranceTotal;
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const grandTotal = subtotal + gstAmount;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5 lg:sticky lg:top-32">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Price Break down</h3>

      {hasPricingBreakdown ? (
        <>
          <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-dashed border-slate-200">
            <label htmlFor="num-persons" className="flex items-center gap-1.5 text-sm text-slate-600">
              <Users className="w-4 h-4 text-blue-600" />
              No. of Persons
            </label>
            <input
              id="num-persons"
              type="number"
              min={1}
              value={persons}
              onChange={(e) => setPersons(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Package Cost (per person)</span>
              <span className="font-semibold text-slate-900">{formatINR(packageCostTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Planning Platform fee</span>
              <span className="font-semibold text-slate-900">{formatINR(platformFee)}</span>
            </div>
            {insurancePerPerson > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Insurance</span>
                <span className="font-semibold text-slate-900">{formatINR(insuranceTotal)}</span>
              </div>
            )}
            <div className="my-2 border-t border-dashed border-slate-200" />
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST ({gstPercent}%)</span>
              <span className="font-semibold text-slate-900">{formatINR(gstAmount)}</span>
            </div>
          </div>
          <div className="my-4 border-t border-dashed border-slate-200" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Grand Total</span>
            <span className="text-xl font-bold text-slate-900">{formatINR(grandTotal)}</span>
          </div>
        </>
      ) : (
        <div className="text-center py-2">
          <div className="text-sm text-slate-500">Starting From</div>
          <div className="text-2xl font-bold text-slate-900">{formatINR(price)}</div>
        </div>
      )}
      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />Best Price Guaranteed
      </div>
    </div>
  );
}
