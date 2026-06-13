const dns = require('dns');
// Disable localhost resolution issues on some machines
dns.setDefaultResultOrder('ipv4first');

async function run() {
  const url = "http://127.0.0.1:3000/api/intel/premium";
  console.log("=== x402 Protocol Test ===");
  console.log(`1. Making GET request to: ${url}`);
  console.log("Sending request WITHOUT payment headers...\n");

  let accepts = [];
  try {
    const res1 = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    console.log("Response Status:", res1.status);
    console.log("Response Status Text:", res1.statusText);

    const paymentRequiredHeader = res1.headers.get("payment-required") || res1.headers.get("x-payment-required");
    if (paymentRequiredHeader) {
      console.log("\nFound payment-required header!");
      const decodedHeader = Buffer.from(paymentRequiredHeader, 'base64').toString('utf-8');
      const info = JSON.parse(decodedHeader);
      accepts = info.accepts;
      console.log("Negotiated payment conditions:");
      console.log(JSON.stringify(info, null, 2));
    } else {
      console.log("Warning: No payment-required header found.");
    }
  } catch (e) {
    console.error("Error on first request:", e.message);
    return;
  }

  if (!accepts || accepts.length === 0) {
    console.error("\nError: No valid payment methods accepted by the server. Cannot proceed.");
    return;
  }

  // 2. Build the payment proof payload (x402 V2 Exact Scheme)
  console.log("\n--------------------------------------------------");
  console.log("2. Simulating Client Signing & Payment Submission");
  console.log("Constructing PAYMENT-SIGNATURE proof header...");

  const payload = {
    x402Version: 2,
    accepted: accepts[0], // Choose the exact payment scheme proposed by the server
    payload: {
      transaction: "dGVzdF90cmFuc2FjdGlvbg==" // base64 mock transaction for local simulation
    }
  };

  const paymentSignatureHeader = Buffer.from(JSON.stringify(payload)).toString("base64");
  console.log("Mock Payment Proof Header built successfully.");

  // 3. Retry the request with the proof header
  console.log(`\n3. Retrying GET request with PAYMENT-SIGNATURE proof...`);
  try {
    const res2 = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "PAYMENT-SIGNATURE": paymentSignatureHeader
      }
    });

    console.log("Response Status:", res2.status);
    
    const paymentRequiredHeader2 = res2.headers.get("payment-required") || res2.headers.get("x-payment-required");
    if (paymentRequiredHeader2) {
      const decodedHeader2 = Buffer.from(paymentRequiredHeader2, 'base64').toString('utf-8');
      const info2 = JSON.parse(decodedHeader2);
      console.log("\nServer rejected the signature as expected in simulator (needs real on-chain confirmation):");
      console.log("Reason:", info2.error || "Verification failed");
    } else {
      const data = await res2.json();
      console.log("\nAccess Granted! Decrypted Response:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Error on retry request:", e.message);
  }
}

run();
