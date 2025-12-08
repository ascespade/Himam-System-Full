-- Database Performance Improvements
-- Adds indexes for unindexed foreign keys and optimizes query performance

-- Indexes for insurance claim embeddings foreign keys
CREATE INDEX IF NOT EXISTS idx_insurance_claim_embeddings_claim_id
  ON insurance_claim_embeddings(claim_id)
  WHERE claim_id IS NOT NULL;

-- Indexes for insurance pattern embeddings foreign keys
CREATE INDEX IF NOT EXISTS idx_insurance_pattern_embeddings_pattern_id
  ON insurance_pattern_embeddings(pattern_id)
  WHERE pattern_id IS NOT NULL;

-- Indexes for patient_insurance foreign keys
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id_active
  ON patient_insurance(patient_id, is_active)
  WHERE is_active = TRUE;

-- Indexes for referrals foreign keys
CREATE INDEX IF NOT EXISTS idx_referrals_patient_id
  ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referring_doctor_id
  ON referrals(referring_doctor_id)
  WHERE referring_doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_referred_to_doctor_id
  ON referrals(referred_to_doctor_id)
  WHERE referred_to_doctor_id IS NOT NULL;

-- Indexes for ai_prompt_templates foreign keys
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_created_by
  ON ai_prompt_templates(created_by)
  WHERE created_by IS NOT NULL;

-- Indexes for workflow_definitions foreign keys
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_created_by
  ON workflow_definitions(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id
  ON workflow_executions(workflow_id);

-- Indexes for reception_queue foreign keys (optimize for status queries)
CREATE INDEX IF NOT EXISTS idx_reception_queue_patient_id
  ON reception_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_reception_queue_appointment_id
  ON reception_queue(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reception_queue_receptionist_id
  ON reception_queue(receptionist_id)
  WHERE receptionist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reception_queue_doctor_id
  ON reception_queue(doctor_id)
  WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reception_queue_status_created
  ON reception_queue(status, created_at);

-- Indexes for case_collaborations foreign keys
CREATE INDEX IF NOT EXISTS idx_case_collaborations_patient_id
  ON case_collaborations(patient_id);
CREATE INDEX IF NOT EXISTS idx_case_collaborations_primary_doctor_id
  ON case_collaborations(primary_doctor_id);
CREATE INDEX IF NOT EXISTS idx_case_collaboration_comments_case_id
  ON case_collaboration_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_collaboration_comments_doctor_id
  ON case_collaboration_comments(doctor_id);

-- Indexes for doctor_patient_relationships foreign keys
CREATE INDEX IF NOT EXISTS idx_doctor_patient_relationships_doctor_id
  ON doctor_patient_relationships(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_relationships_patient_id
  ON doctor_patient_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_relationships_active
  ON doctor_patient_relationships(doctor_id, patient_id, start_date, end_date)
  WHERE end_date IS NULL;

-- Indexes for whatsapp_conversations foreign keys
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_patient_id
  ON whatsapp_conversations(patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_assigned_to
  ON whatsapp_conversations(assigned_to)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status
  ON whatsapp_conversations(status, last_message_at);

-- Indexes for lab_results foreign keys
CREATE INDEX IF NOT EXISTS idx_lab_results_medical_record_id
  ON lab_results(medical_record_id)
  WHERE medical_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id
  ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_ordered_by
  ON lab_results(ordered_by)
  WHERE ordered_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lab_results_performed_date
  ON lab_results(patient_id, performed_date DESC)
  WHERE performed_date IS NOT NULL;

-- Indexes for imaging_results foreign keys
CREATE INDEX IF NOT EXISTS idx_imaging_results_medical_record_id
  ON imaging_results(medical_record_id)
  WHERE medical_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_imaging_results_patient_id
  ON imaging_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_imaging_results_radiologist_id
  ON imaging_results(radiologist_id)
  WHERE radiologist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_imaging_results_performed_date
  ON imaging_results(patient_id, performed_date DESC)
  WHERE performed_date IS NOT NULL;

-- Indexes for prescription_items foreign keys
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id
  ON prescription_items(prescription_id);

-- Indexes for payment_transactions foreign keys
CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient_id
  ON payment_transactions(patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_appointment_id
  ON payment_transactions(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_insurance_claim_id
  ON payment_transactions(insurance_claim_id)
  WHERE insurance_claim_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_by
  ON payment_transactions(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_date
  ON payment_transactions(status, payment_date DESC);

-- Indexes for whatsapp_templates foreign keys
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_created_by
  ON whatsapp_templates(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_messages_template_name
  ON whatsapp_scheduled_messages(template_name)
  WHERE template_name IS NOT NULL;

-- Indexes for insurance_claims foreign keys
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient_id
  ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_created_by
  ON insurance_claims(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status_submitted
  ON insurance_claims(status, submitted_date DESC)
  WHERE submitted_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_claims_ai_submitted
  ON insurance_claims(submitted_by_ai, ai_confidence)
  WHERE submitted_by_ai = TRUE;

-- Indexes for doctor_notes_templates foreign keys
CREATE INDEX IF NOT EXISTS idx_doctor_notes_templates_created_by
  ON doctor_notes_templates(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_notes_templates_category_active
  ON doctor_notes_templates(category, is_active)
  WHERE is_active = TRUE;

-- Indexes for patient_progress_tracking foreign keys
CREATE INDEX IF NOT EXISTS idx_patient_progress_tracking_patient_id
  ON patient_progress_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_progress_tracking_doctor_id
  ON patient_progress_tracking(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_progress_tracking_treatment_plan_id
  ON patient_progress_tracking(treatment_plan_id)
  WHERE treatment_plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_progress_tracking_session_id
  ON patient_progress_tracking(session_id)
  WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_progress_tracking_created_by
  ON patient_progress_tracking(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_progress_tracking_patient_created
  ON patient_progress_tracking(patient_id, created_at DESC);

-- Indexes for appointment_slots foreign keys
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_id
  ON appointment_slots(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_appointment_id
  ON appointment_slots(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_slots_date_available
  ON appointment_slots(doctor_id, date, is_available, is_booked)
  WHERE is_available = TRUE AND is_booked = FALSE;

-- Indexes for alert_rules and alert_instances
CREATE INDEX IF NOT EXISTS idx_alert_instances_rule_id
  ON alert_instances(rule_id)
  WHERE rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alert_instances_status_severity
  ON alert_instances(status, severity, created_at DESC);

-- Indexes for clinic_settings foreign keys
CREATE INDEX IF NOT EXISTS idx_clinic_settings_doctor_id
  ON clinic_settings(doctor_id);

-- Indexes for patient_consents foreign keys
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_id
  ON patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_created_by
  ON patient_consents(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_consents_consent_type_active
  ON patient_consents(patient_id, consent_type, is_given)
  WHERE is_given = TRUE;

-- Indexes for notifications foreign keys
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id
  ON notifications(patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Indexes for working_hours_templates foreign keys
CREATE INDEX IF NOT EXISTS idx_working_hours_templates_doctor_id
  ON working_hours_templates(doctor_id)
  WHERE doctor_id IS NOT NULL;

-- Indexes for medical_records foreign keys (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id
  ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id
  ON medical_records(doctor_id)
  WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date
  ON medical_records(patient_id, date DESC);

-- Indexes for file_attachments foreign keys
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by
  ON file_attachments(uploaded_by)
  WHERE uploaded_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity
  ON file_attachments(entity_type, entity_id);

-- Indexes for slack_messages foreign keys
CREATE INDEX IF NOT EXISTS idx_slack_messages_conversation_id
  ON slack_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_sender_id
  ON slack_messages(sender_id)
  WHERE sender_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slack_messages_conversation_created
  ON slack_messages(conversation_id, created_at DESC);

-- Indexes for invoices foreign keys
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id
  ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id
  ON invoices(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_created_by
  ON invoices(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status_date
  ON invoices(status, issue_date DESC);

-- Indexes for invoice_items foreign keys
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id
  ON invoice_items(invoice_id);

-- Indexes for appointments foreign keys (optimize common queries)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
  ON appointments(patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id
  ON appointments(doctor_id)
  WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments(date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON appointments(doctor_id, date, status)
  WHERE doctor_id IS NOT NULL;

-- Indexes for doctor_working_hours foreign keys
CREATE INDEX IF NOT EXISTS idx_doctor_working_hours_doctor_id
  ON doctor_working_hours(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_working_hours_active
  ON doctor_working_hours(doctor_id, day_of_week, is_active)
  WHERE is_active = TRUE;

-- Indexes for patient_chronic_conditions foreign keys
CREATE INDEX IF NOT EXISTS idx_patient_chronic_conditions_patient_id
  ON patient_chronic_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_chronic_conditions_diagnosed_by
  ON patient_chronic_conditions(diagnosed_by)
  WHERE diagnosed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_chronic_conditions_status
  ON patient_chronic_conditions(patient_id, status)
  WHERE status = 'active';

-- Indexes for prescriptions foreign keys
CREATE INDEX IF NOT EXISTS idx_prescriptions_medical_record_id
  ON prescriptions(medical_record_id)
  WHERE medical_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id
  ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id
  ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status_date
  ON prescriptions(patient_id, status, prescribed_date DESC);

-- Indexes for diagnoses foreign keys
CREATE INDEX IF NOT EXISTS idx_diagnoses_medical_record_id
  ON diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_patient_id
  ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_diagnosed_by
  ON diagnoses(diagnosed_by)
  WHERE diagnosed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diagnoses_status
  ON diagnoses(patient_id, status, diagnosed_date DESC);

-- Indexes for vital_signs foreign keys
CREATE INDEX IF NOT EXISTS idx_vital_signs_medical_record_id
  ON vital_signs(medical_record_id)
  WHERE medical_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id
  ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_by
  ON vital_signs(recorded_by)
  WHERE recorded_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vital_signs_visit_date
  ON vital_signs(patient_id, visit_date DESC);

-- Indexes for whatsapp_messages foreign keys
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id
  ON whatsapp_messages(conversation_id)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_patient_id
  ON whatsapp_messages(patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created
  ON whatsapp_messages(conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;

-- Indexes for patient_visits foreign keys
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient_id
  ON patient_visits(patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_visits_appointment_id
  ON patient_visits(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_visits_doctor_id
  ON patient_visits(doctor_id)
  WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_visits_status_created
  ON patient_visits(status, created_at DESC);

-- Indexes for doctor_schedules foreign keys
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id
  ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_available
  ON doctor_schedules(doctor_id, day_of_week, is_available)
  WHERE is_available = TRUE;

-- Indexes for sessions foreign keys
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id
  ON sessions(patient_id)
  WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_specialist_id
  ON sessions(specialist_id)
  WHERE specialist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_doctor_id
  ON sessions(doctor_id)
  WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_appointment_id
  ON sessions(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_date_status
  ON sessions(date, status)
  WHERE date IS NOT NULL;

-- Indexes for video_sessions foreign keys
CREATE INDEX IF NOT EXISTS idx_video_sessions_session_id
  ON video_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_appointment_id
  ON video_sessions(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_sessions_doctor_id
  ON video_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_patient_id
  ON video_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status
  ON video_sessions(recording_status, started_at DESC);

-- Indexes for treatment_plans foreign keys
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id
  ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_doctor_id
  ON treatment_plans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status
  ON treatment_plans(patient_id, status, start_date DESC);

-- Indexes for patient_allergies foreign keys
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id
  ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_diagnosed_by
  ON patient_allergies(diagnosed_by)
  WHERE diagnosed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_allergies_active
  ON patient_allergies(patient_id, is_active)
  WHERE is_active = TRUE;

-- Indexes for vaccinations foreign keys
CREATE INDEX IF NOT EXISTS idx_vaccinations_patient_id
  ON vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_administered_by
  ON vaccinations(administered_by)
  WHERE administered_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vaccinations_administration_date
  ON vaccinations(patient_id, administration_date DESC);

-- Indexes for appointment_reminders foreign keys
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id
  ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_sent
  ON appointment_reminders(appointment_id, sent, reminder_time);

-- Indexes for auto_documentation_logs foreign keys
CREATE INDEX IF NOT EXISTS idx_auto_documentation_logs_doctor_id
  ON auto_documentation_logs(doctor_id);
CREATE INDEX IF NOT EXISTS idx_auto_documentation_logs_entity
  ON auto_documentation_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_auto_documentation_logs_created
  ON auto_documentation_logs(doctor_id, created_at DESC);

-- Indexes for doctor_performance_metrics foreign keys
CREATE INDEX IF NOT EXISTS idx_doctor_performance_metrics_doctor_id
  ON doctor_performance_metrics(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_performance_metrics_period
  ON doctor_performance_metrics(doctor_id, period_start DESC, period_end DESC);

-- Indexes for slack_conversations foreign keys
CREATE INDEX IF NOT EXISTS idx_slack_conversations_patient_id
  ON slack_conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_slack_conversations_doctor_id
  ON slack_conversations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_slack_conversations_status
  ON slack_conversations(status, last_message_at DESC);

-- Indexes for user_preferences foreign keys
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key
  ON user_preferences(user_id, preference_key);

-- Indexes for task_execution_logs foreign keys
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_task_id
  ON task_execution_logs(task_id)
  WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_status
  ON task_execution_logs(status, started_at DESC);

-- Indexes for activity_logs foreign keys
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON activity_logs(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
  ON activity_logs(entity_type, entity_id)
  WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_created
  ON activity_logs(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Indexes for audit_logs foreign keys
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id)
  WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs(created_at DESC);

-- Indexes for whatsapp_scheduled_messages foreign keys
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_messages_created_by
  ON whatsapp_scheduled_messages(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_messages_status
  ON whatsapp_scheduled_messages(status, scheduled_at);

-- Indexes for case_collaboration_comments foreign keys (if not already indexed above)
CREATE INDEX IF NOT EXISTS idx_case_collaboration_comments_doctor_created
  ON case_collaboration_comments(doctor_id, created_at DESC);

-- Additional composite indexes for common query patterns

-- Insurance claims with embeddings lookup optimization
CREATE INDEX IF NOT EXISTS idx_insurance_claim_embeddings_outcome_provider
  ON insurance_claim_embeddings(outcome, insurance_provider, claim_type)
  WHERE outcome IS NOT NULL;

-- Insurance pattern embeddings for pattern lookup
CREATE INDEX IF NOT EXISTS idx_insurance_pattern_embeddings_type_provider
  ON insurance_pattern_embeddings(pattern_type, insurance_provider, claim_type);

-- Patient insurance active policies
CREATE INDEX IF NOT EXISTS idx_patient_insurance_active_effective
  ON patient_insurance(patient_id, is_active, effective_date DESC, expiry_date DESC)
  WHERE is_active = TRUE;

-- Composite index for appointments with common filters
CREATE INDEX IF NOT EXISTS idx_appointments_patient_doctor_date
  ON appointments(patient_id, doctor_id, date DESC)
  WHERE patient_id IS NOT NULL AND doctor_id IS NOT NULL;

-- Medical records with type and date
CREATE INDEX IF NOT EXISTS idx_medical_records_type_date
  ON medical_records(patient_id, record_type, date DESC);

-- Prescriptions active status
CREATE INDEX IF NOT EXISTS idx_prescriptions_active_patient
  ON prescriptions(patient_id, status, prescribed_date DESC)
  WHERE status = 'active';

