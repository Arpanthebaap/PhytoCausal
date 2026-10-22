# AGENTS.md: Autonomous Agent Operating Protocol & Biophysical Invariants

This document establishes the operational parameters, safety governors, and biophysical invariant constraints for autonomous AI agents (including GitLab Duo, MCP clients, and autonomous reasoning agents) interacting with the **PhytoCausal** framework.

---

## 1. Agent Mission & Behavioral Core

PhytoCausal resolves a critical failure mode in precision agronomy: **observational confounding**.
Visual symptoms of **Abiotic Water Stress (Moisture Deficit)** and **Nutritional Nitrogen Deficiency** both manifest as foliar chlorosis (leaf yellowing / degraded SPAD).

Autonomous agents operating on this repository or invoking its tools MUST adhere to Pearlian Structural Causal Models (SCMs) and Farquhar biophysical laws:
1. **Never prescribe fertilizer solely on visual chlorosis**: Always interrogate transpirational mass-flow ($\Psi_m$ and $g_{sw}$) before diagnosing nitrogen deficiency.
2. **Enforce thermodynamic ceilings**: Net photosynthetic assimilation rate ($A$) must never violate the Farquhar-von Caemmerer-Berry (FvCB) kinetic envelope:
   $$A = \min(A_c, A_j) - R_d$$
3. **Respect counterfactual safety invariants**: Veto any intervention that induces rootzone osmotic burn or nitrate leaching.

---

## 2. Model Context Protocol (MCP v2025-11-25) Tools

PhytoCausal exposes an edge-native MCP server over standard JSON-RPC 2.0 (`POST /api/mcp`) and streamable Server-Sent Events (`GET /api/mcp/sse`).

Agents can invoke the following registered tools:

| Tool Name | Purpose | Key Parameters |
| :--- | :--- | :--- |
| `phytocausal_disambiguate_stress` | Solves Pearlian causal DAG to decouple water deficit from nitrogen starvation | `spadChlorophyll`, `soilMatricPotentialKPa`, `stomatalConductance`, `porewaterEcDsM` |
| `phytocausal_farquhar_boundary` | Evaluates FvCB photosynthetic assimilation limits and emits cryptographic proof | `ci`, `par`, `leafTempC`, `proposedAssimilation` |
| `phytocausal_counterfactual_do` | Simulates intervention outcomes via Pearl's $do(\cdot)$ calculus | `targetIntervention`, `value`, `currentState` |
| `phytocausal_van_genuchten_retention` | Computes volumetric water content from matric suction | `suctionKPa`, `soilTexture` |
| `phytocausal_justes_dilution` | Calculates critical plant nitrogen dilution percentage | `abovegroundBiomassMgHa` |
| `phytocausal_edge_hardware_audit` | Verifies latency and memory envelope on ARM Cortex-A72 hardware | None |

### MCP Resources
Agents can read agronomic calibration curves via MCP resource URIs:
- `phytocausal://agronomy/critical-nitrogen-dilution`
- `phytocausal://soil/van-genuchten-curves`

---

## 3. Development, Testing & Verification Commands

Autonomous agents modifying or verifying code in this repository MUST execute the following pipeline in order:

```bash
# 1. Static Typecheck & Architecture Validation
npm run lint

# 2. Deterministic Biophysical Invariant Proofs (21 Assertions)
npm test

# 3. Production Client Build
npm run build
```

Any modification that causes `npm test` to fail MUST be reverted immediately.

---

## 4. Hardware & Deployment Envelopes

- **Target Architecture**: ARM64 / AMD64 Edge Systems (Raspberry Pi 4, Jetson Nano, industrial IoT gateways).
- **RAM Footprint**: $<128\text{ MB}$ strict ceiling.
- **Inference Latency**: $<15\text{ ms}$ sub-cycle deterministic limit.
- **Privacy & Telemetry**: 100% Zero-Cloud, local offline execution without external telemetry leakage.
