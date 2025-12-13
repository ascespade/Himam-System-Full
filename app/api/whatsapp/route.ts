/**
 * WhatsApp Webhook API Route - ENHANCED VERSION
 * Handles WhatsApp Cloud API webhooks with rich messaging and automated booking
 * Integrated with AI service for intelligent responses
 */

import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/config";
import { generateWhatsAppResponse } from "@/lib/ai";
import { supabaseAdmin } from "@/lib";
import { parseRequestBody } from "@/core/api/middleware";
import { successResponse, errorResponse } from "@/shared/utils/api";
import { HTTP_STATUS } from "@/shared/constants";
import { logError, logInfo, logWarn, logDebug } from "@/shared/utils/logger";
import type { WhatsAppWebhookPayload } from "@/shared/types";
import { whatsappSettingsRepository } from "@/infrastructure/supabase/repositories";
import {
  sendTextMessage,
  sendWelcomeMessage,
  sendSpecialistList,
  sendAppointmentConfirmation,
  sendButtonMessage,
  sendCenterLocation,
  sendDocumentMessage,
  sendTemplateMessage,
  sendAudioMessage,
} from "@/lib/whatsapp-messaging";
import { transcribeAudio, generateAndUploadVoice } from "@/lib/voice-handler";
import {
  parseBookingFromAI,
  hasBookingIntent,
  formatAppointmentDate,
  formatAppointmentTime,
} from "@/lib/booking-parser";
import { executeFlowsForContext } from "@/lib/flows";

/**
 * Webhook verification (GET)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const settings = await getSettings();
    const verifyToken =
      settings.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || "";

    if (mode === "subscribe" && token && token === verifyToken) {
      if (!challenge) {
        return new NextResponse("Challenge missing", {
          status: 400,
          headers: { "Content-Type": "text/plain" },
        });
      }

      return new NextResponse(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    logError("Webhook verification error", error);
    return new NextResponse("Internal server error", {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * Webhook handler (POST) - Process incoming WhatsApp messages
 */
export async function POST(req: NextRequest) {
  // Log raw request for debugging
  const requestUrl = req.nextUrl.toString();
  const requestHeaders = Object.fromEntries(req.headers.entries());

  logDebug("WhatsApp Webhook POST Request", {
    url: requestUrl,
    headers: {
      "content-type": requestHeaders["content-type"],
      "user-agent": requestHeaders["user-agent"],
    },
  });

  try {
    const body = await parseRequestBody<WhatsAppWebhookPayload>(req);

    // Log incoming webhook for debugging
    logDebug("WhatsApp Webhook Received", {
      object: body.object,
      hasEntry: !!body.entry?.[0],
      hasChanges: !!body.entry?.[0]?.changes?.[0],
      hasMessages: !!body.entry?.[0]?.changes?.[0]?.value?.messages,
      messageCount: body.entry?.[0]?.changes?.[0]?.value?.messages?.length || 0,
    });

    // Handle WhatsApp webhook events
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      logDebug("Webhook payload structure", {
        hasEntry: !!entry,
        hasChanges: !!changes,
        hasValue: !!value,
        hasMessages: !!value?.messages,
        messageCount: value?.messages?.length || 0,
        statuses: value?.statuses?.length || 0,
      });

      // Handle status updates (message delivery status)
      if (value?.statuses && value.statuses.length > 0) {
        const status = value.statuses[0];
        logInfo("Message status update", {
          messageId: status.id,
          status: status.status,
          recipientId: status.recipient_id,
        });

        // Update message status in database
        try {
          await supabaseAdmin
            .from("whatsapp_messages")
            .update({ status: status.status })
            .eq("message_id", status.id);
          logInfo("Updated message status in database", {
            messageId: status.id,
          });
        } catch (statusError) {
          logError("Error updating message status", statusError, {
            messageId: status.id,
          });
        }

        return NextResponse.json(successResponse({ status: "status_updated" }));
      }

      // Handle incoming messages
      if (value?.messages && value.messages.length > 0) {
        const message = value.messages[0];
        const from = message.from;
        const messageId = message.id;

        logInfo("Processing WhatsApp message", {
          from,
          messageId,
          type: message.type,
          hasText: !!message.text?.body,
        });

        /*
        if (from === '966581421483') {
           await sendTextMessage(from, 'عذراً، حدث خطأ في النظام. رمز الخطأ: USER_BLOCKED')
           return NextResponse.json(successResponse({ messageId, action: 'blocked' }))
        }
        */

        // Handle different message types
        let text = "";
        let interactiveResponse = null;
        let shouldReplyWithVoice = false;

        if (message.type === "text") {
          text = message.text?.body || "";
        } else if (message.type === "audio") {
          shouldReplyWithVoice = true;
          await sendTextMessage(
            from || "",
            "✨ جاري الاستماع إلى رسالتك الصوتية...",
          );
          const audio = (message as Record<string, unknown>).audio as
            | Record<string, unknown>
            | undefined;
          const audioId = audio?.id as string | undefined;
          if (audioId) {
            text = await transcribeAudio(audioId);
          }
          if (!text) text = "[صوت غير واضح]";
        } else if (message.type === "interactive" && message.interactive) {
          // Handle button/list responses
          interactiveResponse = message.interactive;
          if (
            interactiveResponse.type === "button_reply" &&
            interactiveResponse.button_reply
          ) {
            text = interactiveResponse.button_reply.title || "";
          } else if (
            interactiveResponse.type === "list_reply" &&
            interactiveResponse.list_reply
          ) {
            text = interactiveResponse.list_reply.title || "";
          }
        } else if (
          message.type === "image" ||
          message.type === "document" ||
          message.type === "location"
        ) {
          // Handle media messages (excluding audio which is handled above)
          const mediaTypeMap: Record<string, string> = {
            image: "صورة",
            document: "ملف",
            location: "موقع جغرافي",
          };
          const mediaType = mediaTypeMap[message.type] || "ملف";

          text = `[User sent a ${message.type.toUpperCase()}]`;

          await sendTextMessage(
            from || "",
            `تم استلام ${mediaType}. جاري المعالجة...`,
          );

          // Log media message - will be saved in whatsapp_messages below
        }

        // IMPORTANT: Always save message to DB even if no text (for debugging)
        // Only skip processing if no text, but still save the message
        if (!from) {
          logError(
            "No sender phone number in message",
            new Error("Missing from field"),
            { messageId },
          );
          return NextResponse.json(
            successResponse(null, "No sender phone number"),
          );
        }

        // If no text, still process but with placeholder
        if (!text) {
          logWarn("No text content in message, using placeholder", {
            from,
            messageId,
            type: message.type,
          });
          text = "[No text content]";
        }

        // Check if this is a first-time user (send welcome)
        // Get or create conversation
        let conversation = null;
        const { data: existingConversation } = await supabaseAdmin
          .from("whatsapp_conversations")
          .select("id, phone_number")
          .eq("phone_number", from)
          .single();

        if (existingConversation) {
          conversation = existingConversation;
        } else {
          // Create new conversation
          const { data: newConversation } = await supabaseAdmin
            .from("whatsapp_conversations")
            .insert({
              phone_number: from,
              status: "active",
            })
            .select(
              "id, phone_number, patient_id, status, last_message_at, created_at, updated_at",
            )
            .single();
          conversation = newConversation;
        }

        const isFirstMessage = !existingConversation;

        if (isFirstMessage) {
          logInfo("First time user, sending welcome message", { from });
          try {
            await sendWelcomeMessage(from);
            logInfo("Welcome message sent successfully", { from });
          } catch (welcomeError) {
            logError("Error sending welcome message", welcomeError, { from });
            // Don't fail the webhook - continue processing
          }
          return NextResponse.json(
            successResponse({ messageId, firstTimeUser: true }),
          );
        }

        // Handle quick action buttons
        if (interactiveResponse?.button_reply) {
          const buttonId = interactiveResponse.button_reply.id;

          if (buttonId === "book_appointment") {
            // Fetch doctors (specialists) from database
            const { data: doctors } = await supabaseAdmin
              .from("users")
              .select("id, name, role")
              .eq("role", "doctor")
              .limit(10);

            if (doctors && doctors.length > 0) {
              // Get doctor profiles for specialization
              const doctorIds = doctors.map((d) => d.id);
              const { data: profiles } = await supabaseAdmin
                .from("doctor_profiles")
                .select("user_id, specialization")
                .in("user_id", doctorIds);

              const profilesMap = new Map(
                profiles?.map((p) => [p.user_id, p.specialization]) || [],
              );
              const specialistsWithProfiles = doctors.map((d) => ({
                id: d.id,
                name: d.name,
                specialty: profilesMap.get(d.id) || "أخصائي",
              }));

              await sendSpecialistList(from, specialistsWithProfiles);
              return NextResponse.json(
                successResponse({ messageId, action: "specialist_list_sent" }),
              );
            }
          } else if (buttonId === "our_services") {
            // Fetch services from database
            const { data: services } = await supabaseAdmin
              .from("service_types")
              .select("name_ar, description_ar, icon")
              .eq("is_active", true)
              .order("order_index", { ascending: true });

            const servicesList = (services || [])
              .map(
                (s, i) =>
                  `${i + 1}. ${s.icon ? `${s.icon} ` : ""}${s.name_ar}${s.description_ar ? ` - ${s.description_ar}` : ""}`,
              )
              .join("\n");

            const servicesText = `🏥 خدماتنا المتاحة:\n\n${servicesList || "الخدمات متاحة حسب الجدول"}\n\nللحجز، اضغط على "حجز موعد" أو أرسل رسالة بالخدمة المطلوبة.`;

            await sendTextMessage(from, servicesText);
            return NextResponse.json(
              successResponse({ messageId, action: "services_sent" }),
            );
          } else if (buttonId === "contact_us") {
            // Fetch center info and working hours from database
            const [centerInfo, workingHours] = await Promise.all([
              supabaseAdmin
                .from("center_info")
                .select(
                  "id, name_ar, name_en, address_ar, address_en, phone, email, website, logo_url, created_at, updated_at",
                )
                .limit(1)
                .maybeSingle(),
              supabaseAdmin
                .from("working_hours")
                .select(
                  "id, day_of_week, start_time, end_time, is_working_day, created_at, updated_at",
                )
                .eq("is_working_day", true)
                .order("day_of_week"),
            ]);

            const center = centerInfo.data;
            const hours = workingHours.data || [];
            const workingHoursText =
              hours.length > 0
                ? hours
                    .map((h) => {
                      const days = [
                        "الأحد",
                        "الإثنين",
                        "الثلاثاء",
                        "الأربعاء",
                        "الخميس",
                        "الجمعة",
                        "السبت",
                      ];
                      return `${days[h.day_of_week]}: ${h.start_time} - ${h.end_time}`;
                    })
                    .join("، ")
                : "الأحد-الخميس، 9 صباحاً - 5 مساءً";

            const contactText =
              `📞 معلومات التواصل:\n\n` +
              `📍 الموقع: ${center?.address_ar || "جدة، المملكة العربية السعودية"}\n` +
              `📞 الهاتف: ${center?.phone || "+966 12 345 6789"}\n` +
              `📧 البريد: ${center?.email || "info@al-himam.com"}\n` +
              `⏰ أوقات العمل: ${workingHoursText}`;

            await sendTextMessage(from, contactText);

            // Send location map
            await sendCenterLocation(from);

            return NextResponse.json(
              successResponse({ messageId, action: "contact_sent" }),
            );
          }
        }

        // Fetch conversation history from whatsapp_messages
        const { data: messages } = await supabaseAdmin
          .from("whatsapp_messages")
          .select("content, direction")
          .eq("conversation_id", conversation?.id)
          .order("created_at", { ascending: false })
          .limit(10); // Get last 10 messages (5 exchanges)

        // Fetch Patient Profile (Memory)
        const { data: patientProfile } = await supabaseAdmin
          .from("patients")
          .select("id, name")
          .eq("phone", from)
          .single();

        const patient = patientProfile;

        // Link patient to conversation if found
        if (
          patient &&
          conversation &&
          !conversation.patient_id &&
          conversation.id
        ) {
          const patientId = (patient as Record<string, unknown>)?.id as
            | string
            | undefined;
          if (patientId) {
            await supabaseAdmin
              .from("whatsapp_conversations")
              .update({ patient_id: patientId })
              .eq("id", conversation.id);
          }
        }

        // Format history for AI
        const formattedHistory = messages
          ? messages.reverse().map((m: Record<string, unknown>) => {
              const content =
                typeof m.content === "string"
                  ? m.content
                  : String(m.content || "");
              if (m.direction === "inbound") {
                return { role: "user" as const, content };
              } else {
                return { role: "assistant" as const, content };
              }
            })
          : [];

        // Generate AI response with Patient Context
        let aiResponse;
        try {
          logInfo("Generating AI response", {
            from,
            messagePreview: text.substring(0, 50),
          });
          aiResponse = await generateWhatsAppResponse(
            from,
            text,
            formattedHistory,
            patientProfile?.name,
          );
          logInfo("AI response generated", {
            model: aiResponse.model,
            responsePreview: aiResponse.text.substring(0, 50),
          });
        } catch (aiError: unknown) {
          logError("Error generating AI response", aiError, {
            from,
            messageId,
          });
          // Fallback response if AI fails
          aiResponse = {
            text: "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.",
            model: "error",
          };
          logError("AI response generation failed", aiError);
        }

        // Check if AI extracted booking details (before saving conversation)
        const bookingDetails = parseBookingFromAI(aiResponse.text);

        // Ensure conversation exists
        if (!conversation) {
          const { data: newConv } = await supabaseAdmin
            .from("whatsapp_conversations")
            .insert({
              phone_number: from,
              status: "active",
              patient_id: patient?.id || null,
            })
            .select(
              "id, phone_number, patient_id, status, last_message_at, created_at, updated_at",
            )
            .single();
          conversation = newConv;
        }

        // Get WhatsApp settings for phone number ID
        const whatsappSettings =
          await whatsappSettingsRepository.getActiveSettings();
        const phoneNumberId =
          whatsappSettings?.phone_number_id ||
          process.env.WHATSAPP_PHONE_NUMBER_ID ||
          "";

        // CRITICAL: Save inbound message to whatsapp_messages table FIRST (before any other processing)
        // This ensures we always have a record even if something fails later
        let savedMessage: Record<string, unknown> | null = null;
        try {
          logDebug("Saving inbound message to database", {
            messageId,
            from,
            phoneNumberId,
            conversationId: conversation?.id,
            hasText: !!text,
          });

          // Ensure conversation exists before saving
          if (!conversation || !conversation.id) {
            logWarn("No conversation found, creating one", { from });
            const { data: newConv, error: convError } = await supabaseAdmin
              .from("whatsapp_conversations")
              .insert({
                phone_number: from,
                status: "active",
                patient_id: patient?.id || null,
              })
              .select(
                "id, phone_number, patient_id, status, last_message_at, created_at, updated_at",
              )
              .single();

            if (convError) {
              logError("Failed to create conversation", convError, { from });
            } else {
              conversation = newConv;
              logInfo("Created new conversation", {
                conversationId: conversation.id,
                from,
              });
            }
          }

          const { data: msgData, error } = await supabaseAdmin
            .from("whatsapp_messages")
            .insert({
              message_id: messageId,
              from_phone: from,
              to_phone: phoneNumberId || "unknown",
              message_type: message.type,
              content: text || "[No text content]",
              status: "delivered",
              direction: "inbound",
              session_id: messageId,
              conversation_id: conversation?.id || null,
              patient_id: patient?.id || null,
            })
            .select(
              "id, message_id, from_phone, to_phone, message_type, content, media_url, direction, status, delivered_at, read_at, session_id, conversation_id, patient_id, created_at, updated_at",
            )
            .single();

          if (error) {
            logError("Error saving WhatsApp message to database", error, {
              messageId,
              from,
              conversationId: conversation?.id,
              errorCode: error.code,
            });
            // Log to system_errors table for admin review
            try {
              await supabaseAdmin.from("system_errors").insert({
                error_type: "whatsapp_message_save_failed",
                error_message: error.message || "Unknown error",
                context: {
                  messageId,
                  from,
                  conversationId: conversation?.id,
                  errorCode: error.code,
                },
                severity: "high",
              });
            } catch (dbLogError) {
              logError("Failed to log error to database", dbLogError);
            }
          } else {
            logInfo("Message saved successfully to database", {
              id: msgData?.id,
              messageId,
              conversationId: conversation?.id,
            });
            savedMessage = msgData;
          }
        } catch (err: unknown) {
          logError("Exception saving WhatsApp message", err, {
            messageId,
            from,
          });
          // Log to system_errors
          try {
            await supabaseAdmin.from("system_errors").insert({
              error_type: "whatsapp_message_save_exception",
              error_message:
                err instanceof Error ? err.message : "Unknown exception",
              context: { messageId, from },
              severity: "high",
            });
          } catch {
            // Silent fail
          }
        }

        // Execute flows for WhatsApp message context (non-blocking)
        if (conversation?.id) {
          executeFlowsForContext({
            context_type: "whatsapp_conversation",
            context_id: conversation.id,
            input_data: {
              message: text,
              message_id: messageId,
              from: from,
              patient_id: patient?.id,
              patient_name: patient?.name,
            },
            triggered_by_type: "webhook",
          }).catch((err) => {
            logError("Error executing flows for WhatsApp message", err, {
              from,
              messageId,
            });
          });
        }

        // Create notification for new message (notify admin and reception)
        // Only notify for non-booking messages to avoid spam
        if (conversation && !bookingDetails?.isComplete) {
          try {
            const { createNotificationForRole, NotificationTemplates } =
              await import("@/lib/notifications");

            const patientName = patientProfile?.name || from;
            const template = NotificationTemplates.newMessage(patientName);

            // Notify admin
            await createNotificationForRole("admin", {
              ...template,
              entityType: "conversation",
              entityId: from, // Use phone number as entity ID for chat link
            });

            // Notify reception staff
            await createNotificationForRole("reception", {
              ...template,
              entityType: "conversation",
              entityId: from, // Use phone number as entity ID for chat link
            });
          } catch (e) {
            logError("Failed to create message notification", e, {
              from,
              conversationId: conversation?.id,
            });
          }
        }

        if (bookingDetails && bookingDetails.isComplete) {
          try {
            // 1. Upsert Patient (Critical: Ensure patient exists in DB)
            const { data: patient, error: patientError } = await supabaseAdmin
              .from("patients")
              .upsert(
                {
                  phone: bookingDetails.phone || from,
                  name: bookingDetails.patientName,
                  status: "active",
                  created_at: new Date().toISOString(),
                },
                { onConflict: "phone" },
              )
              .select(
                "id, name, phone, email, nationality, date_of_birth, gender, address, status, allergies, chronic_diseases, emergency_contact, notes, created_at, updated_at",
              )
              .single();

            if (patientError) {
              logError("Error creating patient record", patientError, {
                from,
                bookingDetails,
              });
            }

            // 2. Create Google Calendar Event (if configured)
            let calendarEventId: string | null = null;
            const appointmentDate = new Date(
              `${bookingDetails.date}T${bookingDetails.time}`,
            ).toISOString();

            try {
              const calendarResponse = await fetch(
                `${req.nextUrl.origin}/api/calendar`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "create",
                    patientName: bookingDetails.patientName,
                    phone: bookingDetails.phone || from,
                    specialist: bookingDetails.specialist || "الأخصائي",
                    date: appointmentDate,
                    duration: 60,
                  }),
                },
              );

              if (calendarResponse.ok) {
                const calendarData = await calendarResponse.json();
                calendarEventId = calendarData.calendarEventId || null;
              } else {
                logWarn(
                  "Calendar event creation failed, continuing with DB-only appointment",
                );
              }
            } catch (calendarError) {
              logError("Error creating calendar event", calendarError);
              // Continue with DB-only appointment if calendar fails
            }

            // 3. Create Appointment in Database
            const { data: appointment, error: aptError } = await supabaseAdmin
              .from("appointments")
              .insert({
                patient_name: bookingDetails.patientName, // Fallback
                patient_id: patient?.id, // Link to real patient
                phone: bookingDetails.phone || from,
                specialist: bookingDetails.specialist,
                date: appointmentDate,
                status: calendarEventId ? "confirmed" : "pending",
                calendar_event_id: calendarEventId,
                notes: `Service: ${bookingDetails.service || "Not specified"}`,
              })
              .select(
                "id, patient_id, doctor_id, date, time, duration, appointment_type, status, notes, created_at, updated_at",
              )
              .single();

            if (!aptError && appointment) {
              // 4. Sync with CRM (non-blocking)
              try {
                await fetch(`${req.nextUrl.origin}/api/crm`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "create_appointment",
                    patientId: patient?.id,
                    sessionId: messageId,
                    data: {
                      appointmentId: appointment.id,
                      patientName: bookingDetails.patientName,
                      specialist: bookingDetails.specialist,
                      date: appointmentDate,
                      calendarEventId,
                    },
                  }),
                }).catch((crmError) => {
                  logWarn("CRM sync failed (non-blocking)", {
                    crmError,
                    appointmentId: appointment?.id,
                  });
                });
              } catch (crmError) {
                // CRM sync is optional, continue even if it fails
              }

              // 5. Send confirmation with buttons
              await sendAppointmentConfirmation(from, {
                specialist: bookingDetails.specialist || "الأخصائي",
                date: formatAppointmentDate(bookingDetails.date || ""),
                time: formatAppointmentTime(bookingDetails.time || ""),
              });

              return NextResponse.json(
                successResponse({
                  messageId,
                  aiResponse: aiResponse.text,
                  model: aiResponse.model,
                  bookingCreated: true,
                  appointmentId: appointment.id,
                  calendarEventId,
                }),
              );
            }
          } catch (error) {
            logError("Error creating appointment", error, {
              from,
              bookingDetails,
            });
            // Continue with regular response if booking fails
          }
        }

        // Send AI response (clean version without [BOOKING_READY] marker)
        const cleanResponse = aiResponse.text
          .replace(/\[BOOKING_READY\][\s\S]*?}/g, "")
          .trim();

        let outboundMessageId: string | null = null;

        if (shouldReplyWithVoice) {
          await sendTextMessage(from, "✨ جاري تحويل الرد إلى رسالة صوتية...");
          // Generate Voice
          const audioId = await generateAndUploadVoice(cleanResponse);
          if (audioId) {
            const audioResponse = await sendAudioMessage(from, audioId);
            outboundMessageId = audioResponse?.messageId || null;
          } else {
            const textResponse = await sendTextMessage(from, cleanResponse);
            outboundMessageId = textResponse?.messageId || null;
          }
        } else {
          // Simple direct send like the working commit
          try {
            logInfo("Sending WhatsApp reply", { to: from });
            const textResponse = await sendTextMessage(from, cleanResponse);
            outboundMessageId = textResponse?.messageId || null;
            logInfo("WhatsApp message sent", {
              messageId: outboundMessageId,
              success: textResponse.success,
            });
          } catch (sendError: unknown) {
            logError("Failed to send WhatsApp message", sendError, {
              from,
              messageId: outboundMessageId,
              endpoint: "/api/whatsapp",
            });
            // Don't block the response - webhook should return success to avoid retries
          }
        }

        // Save outbound message to whatsapp_messages table
        if (outboundMessageId) {
          try {
            const { error } = await supabaseAdmin
              .from("whatsapp_messages")
              .insert({
                message_id: outboundMessageId,
                from_phone: phoneNumberId,
                to_phone: from,
                message_type: shouldReplyWithVoice ? "audio" : "text",
                content: cleanResponse,
                status: "sent",
                direction: "outbound",
                conversation_id: conversation?.id || null,
                patient_id: patient
                  ? ((patient as Record<string, unknown>)?.id as
                      | string
                      | undefined) || null
                  : null,
              });
            if (error) {
              logError("Error saving outbound WhatsApp message", error, {
                messageId: outboundMessageId,
                from,
              });
            }
          } catch (err) {
            logError("Exception saving outbound WhatsApp message", err, {
              messageId: outboundMessageId,
              from,
            });
          }
        }

        // If message has booking intent but details incomplete, offer help
        if (hasBookingIntent(text) && !bookingDetails?.isComplete) {
          setTimeout(async () => {
            await sendButtonMessage(from, "هل تحتاج مساعدة في حجز الموعد؟", [
              {
                type: "reply",
                reply: { id: "book_appointment", title: "نعم، ساعدني" },
              },
              {
                type: "reply",
                reply: { id: "continue_chat", title: "لا، شكراً" },
              },
            ]);
          }, 2000); // Send after 2 seconds
        }

        return NextResponse.json(
          successResponse({
            messageId,
            aiResponse: cleanResponse,
            model: aiResponse.model,
            bookingIntent: hasBookingIntent(text),
            bookingComplete: bookingDetails?.isComplete || false,
          }),
        );
      }
    }

    return NextResponse.json(successResponse(null));
  } catch (error) {
    logError("WhatsApp API Error", error);
    return NextResponse.json(errorResponse(error), {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
