/**
 * Billing API Route
 * Handles billing records and invoice management
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib";
import { getSettings } from "@/lib/config";
import { parseRequestBody } from "@/core/api/middleware";
import { withRateLimit } from "@/core/api/middleware/withRateLimit";
import {
  successResponse,
  errorResponse,
  validateRequestBody,
} from "@/shared/utils/api";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "@/shared/constants";
import { logError, logWarn } from "@/shared/utils/logger";
import type { Billing } from "@/shared/types";

interface CreateBillingRequest {
  patientName: string;
  phone?: string;
  amount: number;
  notes?: string;
  invoiceNumber?: string;
}

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody<CreateBillingRequest>(req);

    const validation = validateRequestBody(body, ["patientName", "amount"]);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(errorResponse(validation.errors.join(", ")), {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const { patientName, phone, amount, notes, invoiceNumber } =
      validation.data;

    // Validate and parse amount
    const amountValue =
      typeof amount === "number" ? amount : parseFloat(String(amount));
    if (isNaN(amountValue)) {
      return NextResponse.json(errorResponse("Invalid amount value"), {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Create billing record
    const { data: billing, error } = await supabaseAdmin
      .from("billing")
      .insert({
        patient_name: patientName,
        phone,
        amount: amountValue,
        paid: false,
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
        notes,
      })
      .select(
        "id, patient_name, phone, amount, paid, invoice_number, notes, created_at, updated_at",
      )
      .single();

    if (error) throw error;

    // Sync with CRM if configured (non-blocking)
    const settings = await getSettings();
    if (settings.CRM_URL && settings.CRM_TOKEN) {
      fetch(`${settings.CRM_URL}/billing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.CRM_TOKEN}`,
        },
        body: JSON.stringify({
          action: "create_invoice",
          billingId: billing.id,
          patientName,
          amount,
          invoiceNumber: billing.invoice_number,
        }),
      }).catch((crmError) => {
        logError("CRM billing sync error", crmError, { billingId: billing.id });
      });
    }

    // Map database columns to Billing type
    const mappedBilling: Billing = {
      id: String(billing.id || ""),
      patientName: String(billing.patient_name || ""),
      amount: Number(billing.amount || 0),
      paid: Boolean(billing.paid),
      notes: billing.notes ? String(billing.notes) : undefined,
      createdAt: String(billing.created_at || ""),
      updatedAt: billing.updated_at ? String(billing.updated_at) : undefined,
    };

    return NextResponse.json(
      successResponse<Billing>(mappedBilling, SUCCESS_MESSAGES.CREATED),
    );
  } catch (error) {
    logError("Billing API Error", error);
    return NextResponse.json(errorResponse(error), {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}, "strict");

interface UpdateBillingRequest {
  id: string;
  paid?: boolean;
  amount?: number;
  notes?: string;
}

export const PUT = withRateLimit(async function PUT(req: NextRequest) {
  try {
    const body = await parseRequestBody<UpdateBillingRequest>(req);

    const validation = validateRequestBody(body, ["id"]);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(errorResponse("Billing ID is required"), {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const { id, paid, amount, notes } = validation.data;

    const updates: Partial<Billing> = {};
    if (paid !== undefined && paid !== null) updates.paid = Boolean(paid);
    if (amount !== undefined && amount !== null) {
      const amountValue =
        typeof amount === "number" ? amount : parseFloat(String(amount));
      if (!isNaN(amountValue)) {
        updates.amount = amountValue;
      }
    }
    if (notes !== undefined && notes !== null && typeof notes === "string") {
      updates.notes = notes;
    }

    const { data: billing, error } = await supabaseAdmin
      .from("billing")
      .update(updates)
      .eq("id", id)
      .select(
        "id, patient_name, phone, amount, paid, invoice_number, notes, created_at, updated_at",
      )
      .single();

    if (error) throw error;

    // Map database columns to Billing type
    const mappedBilling: Billing = {
      id: String(billing.id || ""),
      patientName: String(billing.patient_name || ""),
      amount: Number(billing.amount || 0),
      paid: Boolean(billing.paid),
      notes: billing.notes ? String(billing.notes) : undefined,
      createdAt: String(billing.created_at || ""),
      updatedAt: billing.updated_at ? String(billing.updated_at) : undefined,
    };

    return NextResponse.json(
      successResponse<Billing>(mappedBilling, SUCCESS_MESSAGES.UPDATED),
    );
  } catch (error) {
    logError("Billing update error", error);
    return NextResponse.json(errorResponse(error), {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}, "strict");

export const GET = withRateLimit(async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const patientName = searchParams.get("patientName");
    const paid = searchParams.get("paid");

    // Select specific columns for better performance
    let query = supabaseAdmin
      .from("billing")
      .select(
        "id, patient_name, phone, amount, paid, invoice_number, notes, created_at, updated_at",
      )
      .order("created_at", { ascending: false });

    if (patientName) {
      query = query.ilike("patient_name", `%${patientName}%`);
    }

    if (paid !== null && paid !== undefined) {
      query = query.eq("paid", paid === "true");
    }

    const { data: billing, error } = await query;

    if (error) throw error;

    // Map database columns to Billing type
    const mappedBilling: Billing[] = (billing || []).map(
      (item: Record<string, unknown>) => ({
        id: String(item.id || ""),
        patientName: String(item.patient_name || ""),
        amount: Number(item.amount || 0),
        paid: Boolean(item.paid),
        notes: item.notes ? String(item.notes) : undefined,
        createdAt: item.created_at
          ? String(item.created_at)
          : new Date().toISOString(),
        updatedAt: item.updated_at ? String(item.updated_at) : undefined,
      }),
    );

    return NextResponse.json(successResponse<Billing[]>(mappedBilling));
  } catch (error) {
    logError("Billing GET error", error);
    return NextResponse.json(errorResponse(error), {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}, "strict");
