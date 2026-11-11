-- B-056 atomic approve with row locks (no double deduction)

CREATE OR REPLACE FUNCTION public.approve_material_request(
  p_request_id uuid,
  p_reviewer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.material_requests%ROWTYPE;
  v_qty numeric(14,3);
BEGIN
  SELECT * INTO v_req
  FROM public.material_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF v_req.status <> 'PENDING' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_PENDING');
  END IF;

  SELECT remaining_qty INTO v_qty
  FROM public.materials
  WHERE id = v_req.material_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'MATERIAL_MISSING');
  END IF;

  IF v_qty < v_req.quantity THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INSUFFICIENT');
  END IF;

  UPDATE public.materials
  SET
    cumulative_usage = cumulative_usage + v_req.quantity,
    remaining_qty = remaining_qty - v_req.quantity
  WHERE id = v_req.material_id;

  UPDATE public.material_requests
  SET
    status = 'APPROVED',
    reviewer_id = p_reviewer_id,
    reviewed_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('ok', true, 'code', 'APPROVED');
END;
$$;

REVOKE ALL ON FUNCTION public.approve_material_request(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_material_request(uuid, uuid) TO service_role;
