import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeUntrustedText } from "../../src/utils/entityNormalizer.js";

describe("Security & Untrusted Input Sanitization Tests", () => {
  it("strips harmful script tags and keeps text safe", () => {
    const maliciousInput = '<script type="text/javascript">document.location="http://attacker.com"</script>Valid Paper Title';
    const sanitized = sanitizeUntrustedText(maliciousInput);
    assert.ok(!sanitized.includes("<script"));
    assert.ok(sanitized.includes("Valid Paper Title"));
  });

  it("removes dangerous ASCII/Unicode control characters", () => {
    const inputWithControl = "Valid Text\u0000\u0008\u001FWith Control Chars";
    const sanitized = sanitizeUntrustedText(inputWithControl);
    assert.equal(sanitized, "Valid TextWith Control Chars");
  });

  it("caps text length to prevent memory starvation attacks", () => {
    const hugeText = "A".repeat(10000);
    const sanitized = sanitizeUntrustedText(hugeText, 500);
    assert.equal(sanitized.length, 500);
  });
});
