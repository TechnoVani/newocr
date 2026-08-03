export const POLICY_REPORT_SELECT = `
    p.*,
    COALESCE(
        NULLIF(CONCAT_WS(' - ', NULLIF(bqp_employee.name, ''), NULLIF(bqp_employee.employee_code, '')), ''),
        CAST(p.bqp AS CHAR)
    ) AS bqp_display,
    COALESCE(
        NULLIF(CONCAT_WS(' - ', NULLIF(reporting_employee.name, ''), NULLIF(reporting_employee.employee_code, '')), ''),
        CAST(p.reporting_manager AS CHAR)
    ) AS reporting_manager_display,
    COALESCE(
        NULLIF(CONCAT_WS(' - ', NULLIF(relationship_employee.name, ''), NULLIF(relationship_employee.employee_code, '')), ''),
        CAST(p.relationship_manager AS CHAR)
    ) AS relationship_manager_display,
    COALESCE(
        NULLIF(CONCAT_WS(' - ', NULLIF(pos_employee.name, ''), NULLIF(pos_employee.pos_code, '')), ''),
        CAST(p.pos_id AS CHAR)
    ) AS pos_display,
    COALESCE(
        NULLIF(CONCAT_WS(' - ', NULLIF(reference_employee.ref_name, ''), NULLIF(reference_employee.ref_mobile, '')), ''),
        CAST(p.ref_id AS CHAR)
    ) AS reference_display,
    COALESCE(
        NULLIF(CONCAT_WS(' - ', NULLIF(creator_employee.name, ''), NULLIF(creator_employee.employee_code, '')), ''),
        CAST(p.created_by AS CHAR)
    ) AS created_by_display,
    CASE WHEN cancelled_policy.id IS NULL THEN 0 ELSE 1 END AS is_cancelled,
    'Active' AS policy_status,
    cancelled_policy.id AS cancellation_id,
    cancelled_policy.cancellation_date,
    cancelled_policy.created_at AS cancellation_record_created_at,
    cancelled_policy.cancellation_reason
`;

export const POLICY_REPORT_JOINS = `
    LEFT JOIN policies_cancelled cancelled_policy ON cancelled_policy.policy_id = p.id
    LEFT JOIN employees bqp_employee ON p.bqp = bqp_employee.id
    LEFT JOIN employees reporting_employee ON p.reporting_manager = reporting_employee.id
    LEFT JOIN employees relationship_employee ON p.relationship_manager = relationship_employee.id
    LEFT JOIN employee_pos pos_employee ON p.pos_id = pos_employee.id
    LEFT JOIN employee_references reference_employee ON p.ref_id = reference_employee.id
    LEFT JOIN employees creator_employee ON p.created_by = creator_employee.id
`;
