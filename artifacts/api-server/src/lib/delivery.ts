import { clerkClient } from "@clerk/express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { randomBytes } from "node:crypto";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export function createLicenseKey(): string {
  return `GOBLER-${randomBytes(6).toString("hex").toUpperCase()}-${randomBytes(6)
    .toString("hex")
    .toUpperCase()}`;
}

export async function getCustomerEmail(userId: string): Promise<string> {
  const user = await clerkClient.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) {
    throw new Error("Customer does not have a primary email address");
  }
  return email;
}

export async function sendLicenseEmail(input: {
  customerEmail: string;
  productName: string;
  licenseKey: string;
}): Promise<void> {
  const from =
    process.env.RESEND_FROM_EMAIL ??
    "Obsidian Members Club <onboarding@resend.dev>";
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.customerEmail],
      subject: `Your Forex Gobler license — ${input.productName}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171411;max-width:600px">
          <p style="letter-spacing:.18em;text-transform:uppercase;color:#8b6a26;font-size:12px">Obsidian Members Club</p>
          <h1 style="font-size:32px;line-height:1.1">Your Forex Gobler license is ready.</h1>
          <p>Payment for <strong>${escapeHtml(input.productName)}</strong> has been verified.</p>
          <p style="margin:28px 0 8px;text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:#6e6251">Unique license code</p>
          <p style="font-family:monospace;font-size:22px;background:#f1eadc;padding:16px;letter-spacing:.08em">${escapeHtml(input.licenseKey)}</p>
          <p>Keep this code safe. It will be used to activate the Forex Gobler bot you purchased.</p>
          <p>Your bot delivery instructions will follow within <strong>3–5 business days</strong> after successful payment verification.</p>
          <p style="color:#6e6251;font-size:13px">Trading involves risk. This license does not guarantee trading results.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected license email with status ${response.status}`);
  }
}