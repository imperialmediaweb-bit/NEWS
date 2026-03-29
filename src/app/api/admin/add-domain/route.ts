import { NextRequest, NextResponse } from "next/server";

const RAILWAY_API = "https://backboard.railway.app/graphql/v2";

export async function POST(request: NextRequest) {
  try {
    const { token, serviceId, environmentId, domain } = await request.json();

    if (!token || !serviceId || !environmentId || !domain) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Railway GraphQL mutation to add custom domain
    const mutation = `
      mutation customDomainCreate($input: CustomDomainCreateInput!) {
        customDomainCreate(input: $input) {
          id
          domain
          status {
            dnsRecords {
              requiredValue
              currentValue
              recordType
              hostlabel
              zone
              status
            }
          }
        }
      }
    `;

    const variables = {
      input: {
        domain,
        serviceId,
        environmentId,
      },
    };

    const res = await fetch(RAILWAY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const data = await res.json();

    if (data.errors) {
      const errMsg = data.errors.map((e: { message: string }) => e.message).join(", ");
      // If domain already exists, treat as success
      if (errMsg.includes("already") || errMsg.includes("exists")) {
        return NextResponse.json({ success: true, message: "Domain already added", domain });
      }
      return NextResponse.json({ error: errMsg });
    }

    const result = data.data?.customDomainCreate;
    return NextResponse.json({
      success: true,
      domain: result?.domain,
      dnsRecords: result?.status?.dnsRecords,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
