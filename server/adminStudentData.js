export function studentSummary(row) {
  return {
    id:row.id,name:row.full_name || '',full_name:row.full_name || '',email:row.email,phone:row.phone || '',
    is_verified:Boolean(row.email_verified),email_verified:Boolean(row.email_verified),
    status:row.is_suspended ? 'suspended':'active',is_suspended:Boolean(row.is_suspended),
    academic_status:row.academic_status,bams_year:row.bams_year,exam_goal:row.exam_goal,
    enrollment_type:row.enrollment_type || 'self_enrolled',onboarding_state:row.onboarding_state,
    created_at:row.created_at,avatar_url:row.avatar_url || '',admin_notes:row.admin_notes || '',
    membership_id:row.membership_id || null,membership_plan:row.plan_name_snapshot || null,
    membership_plan_title:row.plan_name_snapshot || null,membership_expiry:row.membership_expiry || null,
    membership_status:row.membership_status || null,payment_count:row.payment_count || 0
  };
}

export function studentDetail(student,memberships,orders,now = new Date()) {
  const normalized=memberships.map(m=>({...m,plan_name:m.plan_name_snapshot,starts_at:m.start_date,expires_at:m.expiry_date}));
  const activeMembership=normalized.find(m=>m.status==='active' && Date.parse(m.expiry_date)>now.getTime() && Date.parse(m.start_date)<=now.getTime()) || null;
  return {
    student:studentSummary(student),memberships:normalized,activeMembership,
    orders:orders.map(o=>({id:o.id,order_id:o.id,amount:o.amount,currency:o.currency,status:o.status,
      plan_id:o.plan_id,payment_method:o.payment_method || o.provider,
      utr_number:o.student_submitted_utr || o.razorpay_payment_id || o.provider_payment_id || '',created_at:o.created_at}))
  };
}
